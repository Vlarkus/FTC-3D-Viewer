import { useAppStore } from "../store/useAppStore";
import { telemetryStore } from "../store/telemetryStore";

export class RobotConnectionService {
    private ws: WebSocket | null = null;
    private pollInterval: number | null = null;
    private ip: string;

    constructor(ip: string) {
        this.ip = ip;
    }

    public setIp(ip: string) {
        this.ip = ip;
    }

    public connect() {
        this.updateStatus('connecting');

        // Attempt WebSocket first (common for dashboards)
        try {
            this.ws = new WebSocket(`ws://${this.ip}:8000/dashboard`);

            this.ws.onopen = () => {
                this.updateStatus('connected');
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleTelemetry(data);
                } catch (e) {
                    console.error("Failed to parse telemetry", e);
                }
            };

            this.ws.onclose = () => {
                this.updateStatus('disconnected');
                this.ws = null;
                // Fallback or retry logic could go here
            };

            this.ws.onerror = (err) => {
                console.warn("WebSocket failed, connection error", err);
                this.updateStatus('error');
            };

        } catch (e) {
            console.error("Connection attempt failed", e);
            this.updateStatus('error');
        }
    }

    public disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.updateStatus('disconnected');
    }

    private handleTelemetry(message: any) {
        if (useAppStore.getState().isPaused) return;

        // FTC Dashboard messages are usually objects with "type" and "data"
        // Telemetry is often in data.put or data.data.put
        let telemetryData: Record<string, any> = {};

        if (message.type === 'telemetry' && message.data) {
            // Standard Dashboard packet
            telemetryData = message.data.put || {};
        } else if (message.put) {
            // Raw packet data
            telemetryData = message.put;
        } else {
            // Fallback: use top level if it's a flat object (like the old mock)
            telemetryData = message;
        }

        const updates: Partial<any> = {};

        // Parse and clean keys
        for (const [key, value] of Object.entries(telemetryData)) {
            // Attempt to convert numeric strings to actual numbers for mapping
            if (typeof value === 'string' && !isNaN(parseFloat(value))) {
                updates[key] = parseFloat(value);
            } else {
                updates[key] = value;
            }
        }

        // Apply state update
        if (Object.keys(updates).length > 0) {
            telemetryStore.setState(updates);
        }
    }

    private updateStatus(status: 'disconnected' | 'connecting' | 'connected' | 'error') {
        useAppStore.getState().setConnectionStatus(status);
    }
}
