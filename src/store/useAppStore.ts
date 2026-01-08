import { create } from 'zustand';

export type CameraMode = 'free' | 'orbit';
export type OrbitTarget = 'origin' | 'robot';

export interface AxisSettings {
    min: number;
    max: number;
    size: number;
    step: number;
}

// Geometry Hierarchy Types
export type GeometryType = 'point' | 'line' | 'plane' | 'parametric';

export type CoordinateSpace = 'plot' | 'world';
export type PointShape = 'sphere' | 'box' | 'cone';
export type LineStyle = 'solid' | 'dashed';

export interface GeometryEntity {
    id: string;
    parentId?: string;
    name: string;
    type: GeometryType;
    visible: boolean;
    color: string;

    // V2 Common Properties
    opacity: number;
    coordinateSpace: CoordinateSpace;
    visibleIfOutsideGraph: boolean;

    data: any;
    // TYPE SPECIFIC DATA:
    // point: { position: [x,y,z], radius: number, shape: PointShape }
    // line: { start: [x,y,z], end: [x,y,z], thickness: number, style: LineStyle, dashSize?: number, gapSize?: number }
    // parametric: { 
    //    equation: { x: string, y: string, z: string }, // Full parametric [x(u,v), y(u,v), z(u,v)]
    //    domain: { u: [min, max], v: [min, max] },
    //    colorMap?: string, // 'viridis', etc.
    //    colorMetric?: string // 'z' or function string
    // }
}

export interface GeometryGroup {
    id: string;
    parentId?: string;
    name: string;
    visible: boolean;
    childrenGroups: string[];
    childrenEntities: string[];
}

interface AppState {
    // Connection
    ipAddress: string;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
    setIpAddress: (ip: string) => void;
    setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;

    // View & Camera
    cameraMode: CameraMode;
    orbitTarget: OrbitTarget;
    cameraSpeed: number;
    setCameraMode: (mode: CameraMode) => void;
    setOrbitTarget: (target: OrbitTarget) => void;
    setCameraSpeed: (speed: number) => void;

    // Grid / Plot Box
    showGrid: boolean;
    setShowGrid: (show: boolean) => void;
    axes: { x: AxisSettings; y: AxisSettings; z: AxisSettings };
    setAxisSettings: (axis: 'x' | 'y' | 'z', settings: Partial<AxisSettings>) => void;

    // Geometry System
    groups: Record<string, GeometryGroup>;
    entities: Record<string, GeometryEntity>;
    rootGroupIds: string[];

    // Actions
    addGroup: (group: Omit<GeometryGroup, 'childrenGroups' | 'childrenEntities'>) => void;
    addEntity: (entity: GeometryEntity) => void;
    toggleVisibility: (id: string, isGroup: boolean) => void;
    removeGroup: (id: string) => void;
    removeEntity: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Connection
    ipAddress: '192.168.43.1',
    connectionStatus: 'disconnected',
    setIpAddress: (ip) => set({ ipAddress: ip }),
    setConnectionStatus: (status) => set({ connectionStatus: status }),

    // View
    cameraMode: 'orbit',
    orbitTarget: 'origin',
    cameraSpeed: 10,
    setCameraMode: (mode) => set({ cameraMode: mode }),
    setOrbitTarget: (target) => set({ orbitTarget: target }),
    setCameraSpeed: (speed) => set({ cameraSpeed: speed }),

    // Grid
    showGrid: true,
    setShowGrid: (show) => set({ showGrid: show }),
    axes: {
        x: { min: -10, max: 10, size: 20, step: 2 },
        y: { min: -10, max: 10, size: 20, step: 2 },
        z: { min: -10, max: 10, size: 20, step: 2 },
    },
    setAxisSettings: (axis, settings) => set((state) => ({
        axes: { ...state.axes, [axis]: { ...state.axes[axis], ...settings } }
    })),

    // Geometry
    groups: {},
    entities: {},
    rootGroupIds: [],

    addGroup: (group) => set((state) => {
        const newGroup: GeometryGroup = { ...group, childrenGroups: [], childrenEntities: [] };
        const newState = {
            groups: { ...state.groups, [group.id]: newGroup }
        };

        if (group.parentId && state.groups[group.parentId]) {
            return {
                groups: {
                    ...newState.groups,
                    [group.parentId]: {
                        ...state.groups[group.parentId],
                        childrenGroups: [...state.groups[group.parentId].childrenGroups, group.id]
                    }
                }
            };
        } else {
            return {
                groups: newState.groups,
                rootGroupIds: [...state.rootGroupIds, group.id]
            };
        }
    }),

    addEntity: (entity) => set((state) => {
        // Ensure V2 defaults if missing
        const safeEntity = {
            ...entity,
            opacity: entity.opacity ?? 1.0,
            coordinateSpace: entity.coordinateSpace ?? 'plot',
            visibleIfOutsideGraph: entity.visibleIfOutsideGraph ?? true,
        };

        const newState = {
            entities: { ...state.entities, [entity.id]: safeEntity }
        };

        if (entity.parentId && state.groups[entity.parentId]) {
            return {
                entities: newState.entities,
                groups: {
                    ...state.groups,
                    [entity.parentId]: {
                        ...state.groups[entity.parentId],
                        childrenEntities: [...state.groups[entity.parentId].childrenEntities, entity.id]
                    }
                }
            };
        }
        return newState;
    }),

    toggleVisibility: (id, isGroup) => set((state) => {
        if (isGroup) {
            const group = state.groups[id];
            if (!group) return {};
            return { groups: { ...state.groups, [id]: { ...group, visible: !group.visible } } };
        } else {
            const entity = state.entities[id];
            if (!entity) return {};
            return { entities: { ...state.entities, [id]: { ...entity, visible: !entity.visible } } };
        }
    }),

    removeGroup: (id) => set((state) => {
        const { [id]: deleted, ...remainingGroups } = state.groups;
        const newRootIds = state.rootGroupIds.filter(gid => gid !== id);
        return { groups: remainingGroups, rootGroupIds: newRootIds };
    }),

    removeEntity: (id) => set((state) => {
        const { [id]: deleted, ...remainingEntities } = state.entities;
        return { entities: remainingEntities };
    }),
}));
