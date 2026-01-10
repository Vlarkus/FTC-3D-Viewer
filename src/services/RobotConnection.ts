import { useAppStore } from "../store/useAppStore";
import { telemetryStore } from "../store/telemetryStore";

export class RobotConnectionService {
    private ws: WebSocket | null = null;
    private pollInterval: number | null = null;
    private ip: string;
    private readonly pollMs = 100;
    private readonly maxConsecutiveFailures = 30;
    private readonly port = 12345;

    constructor(ip: string) {
        this.ip = ip;
    }

    public setIp(ip: string) {
        this.ip = ip;
    }

    public connect() {
        this.updateStatus('connecting');

        this.startPolling();
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

    private startPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        const baseUrl = `http://${this.ip}:${this.port}`;
        let seenConnected = false;
        let failureCount = 0;

        const pollOnce = async () => {
            try {
                const response = await fetch(`${baseUrl}/telemetry`, { cache: "no-store" });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                this.handleTelemetry(data);

                failureCount = 0;
                if (!seenConnected) {
                    seenConnected = true;
                    this.updateStatus('connected');
                }
            } catch (e) {
                failureCount += 1;
                if (seenConnected) {
                    this.updateStatus('disconnected');
                } else {
                    this.updateStatus('error');
                }
                if (failureCount >= this.maxConsecutiveFailures && this.pollInterval) {
                    clearInterval(this.pollInterval);
                    this.pollInterval = null;
                }
            }
        };

        pollOnce();
        this.pollInterval = window.setInterval(pollOnce, this.pollMs);
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
            const normalizedKey = key.startsWith("robot.") ? key.slice("robot.".length) : key;
            // Attempt to convert numeric strings to actual numbers for mapping
            if (typeof value === 'string' && !isNaN(parseFloat(value))) {
                updates[normalizedKey] = parseFloat(value);
            } else {
                updates[normalizedKey] = value;
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
