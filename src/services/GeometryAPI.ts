import { useAppStore, type GeometryEntity, type CoordinateSpace, type PointShape, type LineStyle } from '../store/useAppStore';
import { v4 as uuidv4 } from 'uuid';

export interface StyleOptions {
    opacity?: number;
    visibleIfOutsideGraph?: boolean;
    coordinateSpace?: CoordinateSpace;
}

export interface PointOptions extends StyleOptions {
    radius?: number;
    shape?: PointShape;
    color?: string;
}

export interface SegmentOptions extends StyleOptions {
    thickness?: number;
    style?: LineStyle;
    dashSize?: number;
    gapSize?: number;
    color?: string;
}

export interface ParametricOptions extends StyleOptions {
    color?: string;
    // We could add colorMap here later
}

// Expose these helpers globally
export class GeometryAPI {
    static addGroup(name: string, parentId?: string): string {
        const id = uuidv4();
        useAppStore.getState().addGroup({ id, name, parentId, visible: true });
        return id;
    }

    static addPoint(name: string, position: [number, number, number], parentId?: string, options: PointOptions = {}) {
        const id = uuidv4();
        const entity: GeometryEntity = {
            id, name, type: 'point', parentId, visible: true,
            color: options.color || 'red',
            opacity: options.opacity ?? 1,
            coordinateSpace: options.coordinateSpace || 'plot',
            visibleIfOutsideGraph: options.visibleIfOutsideGraph ?? true,
            data: {
                position,
                radius: options.radius ?? 0.5,
                shape: options.shape || 'sphere'
            }
        };
        useAppStore.getState().addEntity(entity);
        return id;
    }

    static addSegment(name: string, start: [number, number, number], end: [number, number, number], parentId?: string, options: SegmentOptions = {}) {
        const id = uuidv4();
        const entity: GeometryEntity = {
            id, name, type: 'line', parentId, visible: true,
            color: options.color || 'green',
            opacity: options.opacity ?? 1,
            coordinateSpace: options.coordinateSpace || 'plot',
            visibleIfOutsideGraph: options.visibleIfOutsideGraph ?? true,
            data: {
                start, end,
                thickness: options.thickness ?? 2,
                style: options.style || 'solid',
                dashSize: options.dashSize,
                gapSize: options.gapSize
            }
        };
        useAppStore.getState().addEntity(entity);
        return id;
    }

    static addCubicBezier(
        name: string,
        start: [number, number, number],
        control1: [number, number, number],
        control2: [number, number, number],
        end: [number, number, number],
        parentId?: string,
        options: SegmentOptions = {}
    ) {
        const id = uuidv4();
        const entity: GeometryEntity = {
            id, name, type: 'cubic-bezier', parentId, visible: true,
            color: options.color || 'green',
            opacity: options.opacity ?? 1,
            coordinateSpace: options.coordinateSpace || 'plot',
            visibleIfOutsideGraph: options.visibleIfOutsideGraph ?? true,
            data: {
                start,
                control1,
                control2,
                end,
                thickness: options.thickness ?? 2,
                style: options.style || 'solid',
                dashSize: options.dashSize,
                gapSize: options.gapSize
            }
        };
        useAppStore.getState().addEntity(entity);
        return id;
    }

    static addParametricSurface(
        name: string,
        equation: string | { x: string, y: string, z: string },
        domain: { u: [number, number], v: [number, number] },
        parentId?: string,
        options: ParametricOptions = {}
    ) {
        const id = uuidv4();
        const entity: GeometryEntity = {
            id, name, type: 'parametric', parentId, visible: true,
            color: options.color || 'blue',
            opacity: options.opacity ?? 1,
            coordinateSpace: options.coordinateSpace || 'plot',
            visibleIfOutsideGraph: options.visibleIfOutsideGraph ?? true,
            data: { equation, domain }
        };
        useAppStore.getState().addEntity(entity);
        return id;
    }

    static clearAll() {
        // TODO: Implement clear logic
    }
}

// Attach to window
(window as any).ftc3d = GeometryAPI;
