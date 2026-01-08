import type { CoordinateSpace, PointShape, LineStyle } from '../store/useAppStore';

// Configuration types (plain objects, not store entities)
export interface PointConfig {
    type: 'point';
    name: string;
    position: [number, number, number];
    options: {
        color?: string;
        opacity?: number;
        radius?: number;
        shape?: PointShape;
        coordinateSpace?: CoordinateSpace;
        visibleIfOutsideGraph?: boolean;
    };
}

export interface SegmentConfig {
    type: 'segment';
    name: string;
    start: [number, number, number];
    end: [number, number, number];
    options: {
        color?: string;
        opacity?: number;
        thickness?: number;
        style?: LineStyle;
        dashSize?: number;
        gapSize?: number;
        coordinateSpace?: CoordinateSpace;
        visibleIfOutsideGraph?: boolean;
    };
}

export interface ParametricConfig {
    type: 'parametric';
    name: string;
    equation: string | { x: string; y: string; z: string };
    domain: { u: [number, number]; v: [number, number] };
    options: {
        color?: string;
        opacity?: number;
        coordinateSpace?: CoordinateSpace;
        visibleIfOutsideGraph?: boolean;
    };
}

export interface GroupConfig {
    type: 'group';
    name: string;
    options: {
        visible?: boolean;
    };
    children: GeometryConfig[];
}

export type GeometryConfig = PointConfig | SegmentConfig | ParametricConfig | GroupConfig;

// Builder functions
export function point(
    name: string,
    position: [number, number, number],
    options: PointConfig['options'] = {}
): PointConfig {
    return {
        type: 'point',
        name,
        position,
        options
    };
}

export function segment(
    name: string,
    start: [number, number, number],
    end: [number, number, number],
    options: SegmentConfig['options'] = {}
): SegmentConfig {
    return {
        type: 'segment',
        name,
        start,
        end,
        options
    };
}

export function parametric(
    name: string,
    equation: string | { x: string; y: string; z: string },
    domain: { u: [number, number]; v: [number, number] },
    options: ParametricConfig['options'] = {}
): ParametricConfig {
    return {
        type: 'parametric',
        name,
        equation,
        domain,
        options
    };
}

export function group(
    name: string,
    options: GroupConfig['options'] = {},
    children: GeometryConfig[] = []
): GroupConfig {
    return {
        type: 'group',
        name,
        options,
        children
    };
}
