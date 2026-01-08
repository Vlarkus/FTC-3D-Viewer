import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

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

    // Telemetry Mapping
    telemetryMapping: { x?: string; y?: string; z?: string };
    setTelemetryMapping: (axis: 'x' | 'y' | 'z', key: string | undefined) => void;

    // Actions
    addGroup: (group: Omit<GeometryGroup, 'childrenGroups' | 'childrenEntities'>) => void;
    addEntity: (entity: GeometryEntity) => void;
    toggleVisibility: (id: string, isGroup: boolean) => void;
    removeGroup: (id: string) => void;
    removeEntity: (id: string) => void;
    loadGeometryConfig: (config: any[]) => void;
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

    // Telemetry Mapping
    telemetryMapping: { x: 'x', y: 'y', z: 'z' },
    setTelemetryMapping: (axis, key) => set((state) => {
        const newMapping = { ...state.telemetryMapping, [axis]: key };
        // Ensure exclusivity: if this key was used elsewhere, remove it
        if (key) {
            if (axis !== 'x' && state.telemetryMapping.x === key) newMapping.x = undefined;
            if (axis !== 'y' && state.telemetryMapping.y === key) newMapping.y = undefined;
            if (axis !== 'z' && state.telemetryMapping.z === key) newMapping.z = undefined;
        }
        return { telemetryMapping: newMapping };
    }),

    // Geometry (initialized empty, loaded from config)
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

    loadGeometryConfig: (config) => set(() => {
        const newGroups: Record<string, GeometryGroup> = {};
        const newEntities: Record<string, GeometryEntity> = {};
        const newRootGroupIds: string[] = [];

        const processConfig = (item: any, parentId?: string): string => {
            const id = uuidv4();

            if (item.type === 'group') {
                // Create group
                const group: GeometryGroup = {
                    id,
                    name: item.name,
                    visible: item.options.visible ?? true,
                    parentId,
                    childrenGroups: [],
                    childrenEntities: []
                };

                // Process children
                item.children.forEach((child: any) => {
                    const childId = processConfig(child, id);
                    if (child.type === 'group') {
                        group.childrenGroups.push(childId);
                    } else {
                        group.childrenEntities.push(childId);
                    }
                });

                newGroups[id] = group;

                // Add to root if no parent
                if (!parentId) {
                    newRootGroupIds.push(id);
                }
            } else {
                // Create entity (point, segment, parametric)
                let entity: GeometryEntity;

                if (item.type === 'point') {
                    entity = {
                        id,
                        name: item.name,
                        type: 'point',
                        parentId,
                        visible: true,
                        color: item.options.color || 'red',
                        opacity: item.options.opacity ?? 1,
                        coordinateSpace: item.options.coordinateSpace || 'plot',
                        visibleIfOutsideGraph: item.options.visibleIfOutsideGraph ?? true,
                        data: {
                            position: item.position,
                            radius: item.options.radius ?? 0.5,
                            shape: item.options.shape || 'sphere'
                        }
                    };
                } else if (item.type === 'segment') {
                    entity = {
                        id,
                        name: item.name,
                        type: 'line',
                        parentId,
                        visible: true,
                        color: item.options.color || 'green',
                        opacity: item.options.opacity ?? 1,
                        coordinateSpace: item.options.coordinateSpace || 'plot',
                        visibleIfOutsideGraph: item.options.visibleIfOutsideGraph ?? true,
                        data: {
                            start: item.start,
                            end: item.end,
                            thickness: item.options.thickness ?? 2,
                            style: item.options.style || 'solid',
                            dashSize: item.options.dashSize,
                            gapSize: item.options.gapSize
                        }
                    };
                } else if (item.type === 'parametric') {
                    entity = {
                        id,
                        name: item.name,
                        type: 'parametric',
                        parentId,
                        visible: true,
                        color: item.options.color || 'blue',
                        opacity: item.options.opacity ?? 1,
                        coordinateSpace: item.options.coordinateSpace || 'plot',
                        visibleIfOutsideGraph: item.options.visibleIfOutsideGraph ?? true,
                        data: {
                            equation: item.equation,
                            domain: item.domain
                        }
                    };
                } else {
                    throw new Error(`Unknown entity type: ${item.type}`);
                }

                newEntities[id] = entity;
            }

            return id;
        };

        // Process all top-level items
        config.forEach((item: any) => processConfig(item));

        return {
            groups: newGroups,
            entities: newEntities,
            rootGroupIds: newRootGroupIds
        };
    }),
}));
