import { useAppStore } from "../store/useAppStore";
import { telemetryStore, type RobotState } from "../store/telemetryStore";

export class MockRobotConnectionService {
    private updateInterval: number | null = null;
    private state: RobotState = {
        x: 0,
        y: 0,
        z: 0,
        roll: 0,
        pitch: 0,
        heading: 0,
        flywheelVelocity: 0,
        deflectorAngle: 0,
        yawControl: 0,
        distanceToTarget: 10,
    };

    private velocities = {
        x: 0,
        y: 0,
        heading: 0,
        flywheel: 0,
        deflector: 0,
        yaw: 0,
        distance: 0
    };

    public connect() {
        this.updateStatus('connected');

        // Simulation loop @ ~20Hz (50ms)
        this.updateInterval = window.setInterval(() => {
            if (useAppStore.getState().isPaused) return;
            this.stepSimulation();
            telemetryStore.setState(this.state);
        }, 50);
    }

    public disconnect() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.updateStatus('disconnected');
    }

    private stepSimulation() {
        // Random walk logic for smooth continuous movement

        // 1. Update velocities with some "noise" or acceleration
        this.velocities.x += (Math.random() - 0.5) * 0.1;
        this.velocities.y += (Math.random() - 0.5) * 0.1;
        this.velocities.heading += (Math.random() - 0.5) * 0.05;

        // Dampen velocities
        this.velocities.x *= 0.95;
        this.velocities.y *= 0.95;
        this.velocities.heading *= 0.95;

        // 2. Update positions
        this.state.x += this.velocities.x;
        this.state.y += this.velocities.y;
        this.state.heading += this.velocities.heading;

        // Keep in bounds [-10, 10] roughly
        if (Math.abs(this.state.x) > 8) this.velocities.x *= -1.2;
        if (Math.abs(this.state.y) > 8) this.velocities.y *= -1.2;

        // 3. Update other telemetry
        // Flywheel velocity (fluctuates around 5000)
        this.state.flywheelVelocity = 5000 + Math.sin(Date.now() / 1000) * 200 + (Math.random() - 0.5) * 50;

        // Deflector angle (periodic movement)
        this.state.deflectorAngle = 45 + Math.sin(Date.now() / 2000) * 30;

        // Yaw control (-1 to 1)
        this.state.yawControl = Math.sin(Date.now() / 500) * 0.8 + (Math.random() - 0.5) * 0.1;

        // Distance to target (decreasing then resetting or just random)
        this.state.distanceToTarget = 5 + Math.abs(Math.cos(Date.now() / 3000)) * 10;
    }

    private updateStatus(status: 'disconnected' | 'connecting' | 'connected' | 'error') {
        useAppStore.getState().setConnectionStatus(status);
    }
}
