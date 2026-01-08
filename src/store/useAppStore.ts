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
    ipAddress: '',
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
        x: { min: -10, max: 10, size: 10, step: 1 },
        y: { min: -10, max: 10, size: 10, step: 1 },
        z: { min: -10, max: 10, size: 10, step: 1 },
    },
    setAxisSettings: (axis, settings) => set((state) => {
        const newSettings = { ...state.axes[axis], ...settings };
        // Enforce step >= 0
        if (newSettings.step < 0) newSettings.step = 0;
        return {
            axes: { ...state.axes, [axis]: newSettings }
        };
    }),

    // Geometry
    groups: {
        'demo-group': {
            id: 'demo-group',
            name: 'Demo Geometry',
            visible: false,
            childrenGroups: [],
            childrenEntities: ['demo-point', 'demo-line', 'demo-plane']
        }
    },
    entities: {
        'demo-point': {
            id: 'demo-point',
            name: 'Translucent Box',
            type: 'point',
            parentId: 'demo-group',
            visible: true,
            color: '#00ff00',
            opacity: 0.5,
            coordinateSpace: 'plot',
            visibleIfOutsideGraph: true,
            data: { position: [0, 5, 0], radius: 2, shape: 'box' }
        },
        'demo-line': {
            id: 'demo-line',
            name: 'Capped Line',
            type: 'line',
            parentId: 'demo-group',
            visible: true,
            color: 'orange',
            opacity: 1,
            coordinateSpace: 'plot',
            visibleIfOutsideGraph: false,
            data: { start: [-50, 5, -50], end: [50, 5, 50], thickness: 5, style: 'dashed' }
        },
        'demo-plane': {
            id: 'demo-plane',
            name: 'Limited Spiral',
            type: 'parametric',
            parentId: 'demo-group',
            visible: true,
            color: '#00ccff',
            opacity: 0.8,
            coordinateSpace: 'plot',
            visibleIfOutsideGraph: false,
            data: {
                equation: { x: "u * Math.cos(v)", y: "u * Math.sin(v)", z: "v * 2" },
                domain: { u: [2, 12], v: [0, 40] }
            }
        }
    },
    rootGroupIds: ['demo-group'],

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
