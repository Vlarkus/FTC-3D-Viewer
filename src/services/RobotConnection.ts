import { useAppStore } from "../store/useAppStore";
import { telemetryStore } from "../store/telemetryStore";

export class RobotConnectionService {
    private ws: WebSocket | null = null;
    private pollInterval: number | null = null;
    private ip: string;

    constructor(ip: string) {
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

    private handleTelemetry(data: any) {
        // Expecting data in structure roughly equivalent to what we need
        // This mapping might need to be configurable in UI later
        const x = typeof data.x === 'number' ? data.x : 0;
        const y = typeof data.y === 'number' ? data.y : 0;
        const z = typeof data.z === 'number' ? data.z : 0;
        const heading = typeof data.heading === 'number' ? data.heading : 0;

        // Transient update - no React render trigger!
        telemetryStore.setState({ x, y, z, heading });
    }

    private updateStatus(status: 'disconnected' | 'connecting' | 'connected' | 'error') {
        useAppStore.getState().setConnectionStatus(status);
    }
}
