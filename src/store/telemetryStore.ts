/**
 * Transient State Store
 * 
 * Ideally, we want to update the robot's position 60 times a second without attempting
 * to re-render the entire React component tree. We use a vanilla subscription pattern.
 */

export interface RobotState {
    x: number;
    y: number;
    z: number;
    roll: number;
    pitch: number;
    heading: number;
    flywheelVelocity: number;
    deflectorAngle: number;
    yawControl: number;
    distanceToTarget: number;
}

const initialState: RobotState = {
    x: 0,
    y: 0,
    z: 0,
    roll: 0,
    pitch: 0,
    heading: 0,
    flywheelVelocity: 0,
    deflectorAngle: 0,
    yawControl: 0,
    distanceToTarget: 0,
};

let currentState: RobotState = { ...initialState };
const listeners: Set<() => void> = new Set();

export const telemetryStore = {
    getState: () => currentState,

    setState: (newState: Partial<RobotState>) => {
        currentState = { ...currentState, ...newState };
        listeners.forEach((listener) => listener());
    },

    subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    reset: () => {
        currentState = { ...initialState };
        listeners.forEach((listener) => listener());
    }
};
