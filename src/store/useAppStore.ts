import { create } from 'zustand';

export type CameraMode = 'free' | 'follow' | 'orbit';

export interface PrimitiveSegment {
    id: string;
    start: [number, number, number];
    end: [number, number, number];
    color: string;
    label?: string;
}

export interface PrimitivePlane {
    id: string;
    equation: string; // e.g. "z = sin(x)"
    color: string;
    opacity: number;
}

interface AppState {
    // Connection
    ipAddress: string;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
    setIpAddress: (ip: string) => void;
    setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;

    // View
    cameraMode: CameraMode;
    setCameraMode: (mode: CameraMode) => void;
    showGrid: boolean;
    setShowGrid: (show: boolean) => void;

    // Primitives
    segments: PrimitiveSegment[];
    planes: PrimitivePlane[];
    addSegment: (segment: PrimitiveSegment) => void;
    removeSegment: (id: string) => void;
    addPlane: (plane: PrimitivePlane) => void;
    removePlane: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Connection
    ipAddress: '192.168.43.1',
    connectionStatus: 'disconnected',
    setIpAddress: (ip) => set({ ipAddress: ip }),
    setConnectionStatus: (status) => set({ connectionStatus: status }),

    // View
    cameraMode: 'free',
    setCameraMode: (mode) => set({ cameraMode: mode }),
    showGrid: true,
    setShowGrid: (show) => set({ showGrid: show }),

    // Primitives
    segments: [],
    planes: [],
    addSegment: (segment) => set((state) => ({ segments: [...state.segments, segment] })),
    removeSegment: (id) => set((state) => ({ segments: state.segments.filter((s) => s.id !== id) })),
    addPlane: (plane) => set((state) => ({ planes: [...state.planes, plane] })),
    removePlane: (id) => set((state) => ({ planes: state.planes.filter((p) => p.id !== id) })),
}));
