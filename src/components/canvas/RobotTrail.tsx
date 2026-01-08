import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, Color } from 'three';
import { telemetryStore } from '../../store/telemetryStore';
import { useCoordinateMapper } from '../../hooks/useCoordinateMapper';
import { useAppStore } from '../../store/useAppStore';

type TrailPoint = {
    x: number;
    y: number;
    z: number;
    t: number;
};

type TrailMarker = TrailPoint | { break: true };

const epsilon = 1e-4;
const maxTrailPoints = 10000;

export const RobotTrail = () => {
    const lineGeometryRef = useRef<BufferGeometry>(null);
    const pointsGeometryRef = useRef<BufferGeometry>(null);
    const trailRef = useRef<TrailMarker[]>([]);
    const lastPointRef = useRef<[number, number, number] | null>(null);

    const { mapPoint } = useCoordinateMapper();
    const { trailSettings, trailClearToken, setTrailSettings } = useAppStore();
    const telemetryMapping = useAppStore(state => state.telemetryMapping);
    const baseTrailColor = useRef(new Color(trailSettings.color));

    useEffect(() => {
        trailRef.current = [];
        lastPointRef.current = null;
    }, [trailClearToken, trailSettings.mode, trailSettings.tempUnit]);

    useEffect(() => {
        baseTrailColor.current.set(trailSettings.color);
    }, [trailSettings.color]);

    useFrame((state) => {
        const rawData = telemetryStore.getState() as any;

        const x = telemetryMapping.x ? (rawData[telemetryMapping.x] ?? 0) : 0;
        const y = telemetryMapping.y ? (rawData[telemetryMapping.y] ?? 0) : 0;
        const z = telemetryMapping.z ? (rawData[telemetryMapping.z] ?? 0) : 0;

        const [vx, vy, vz] = mapPoint(x, y, z);

        const shouldAddPoint = trailSettings.mode === 'controllable'
            ? !trailSettings.controllablePaused
            : true;

        if (shouldAddPoint) {
            const last = lastPointRef.current;
            const isSame = last
                && Math.abs(last[0] - vx) < epsilon
                && Math.abs(last[1] - vy) < epsilon
                && Math.abs(last[2] - vz) < epsilon;

            if (!isSame) {
                if (trailSettings.breakNextSegment) {
                    trailRef.current.push({ break: true });
                    setTrailSettings({ breakNextSegment: false });
                }

                trailRef.current.push({
                    x: vx,
                    y: vy,
                    z: vz,
                    t: state.clock.elapsedTime
                });
                lastPointRef.current = [vx, vy, vz];
            }
        }

        if (trailRef.current.length > maxTrailPoints) {
            trailRef.current.splice(0, trailRef.current.length - maxTrailPoints);
        }

        if (trailSettings.mode === 'temporary') {
            if (trailSettings.tempUnit === 'updates') {
                const maxPoints = Math.max(1, Math.floor(trailSettings.tempLength));
                let pointsCount = 0;
                for (let i = trailRef.current.length - 1; i >= 0; i -= 1) {
                    if ('break' in trailRef.current[i]) continue;
                    pointsCount += 1;
                    if (pointsCount > maxPoints) {
                        trailRef.current.splice(0, i + 1);
                        break;
                    }
                }
            } else {
                const now = state.clock.elapsedTime;
                const windowSeconds = Math.max(0.05, trailSettings.tempLength);
                trailRef.current = trailRef.current.filter(point => {
                    if ('break' in point) return true;
                    return (now - point.t) <= windowSeconds;
                });
            }
        }

        if (trailSettings.display === 'none') {
            return;
        }

        const geometry = trailSettings.display === 'segments'
            ? lineGeometryRef.current
            : pointsGeometryRef.current;

        if (!geometry) return;

        const trail = trailRef.current;
        const now = state.clock.elapsedTime;
        const windowSeconds = Math.max(0.05, trailSettings.tempLength);
        const maxPoints = Math.max(1, Math.floor(trailSettings.tempLength));

        const pointData: TrailPoint[] = trail.filter((point): point is TrailPoint => !('break' in point));
        const pointCount = pointData.length;

        const getAlpha = (pointIndex: number, point: TrailPoint) => {
            if (trailSettings.mode === 'temporary') {
                if (trailSettings.tempUnit === 'updates') {
                    const age = Math.max(0, pointCount - 1 - pointIndex);
                    return Math.max(0, Math.min(1, 1 - (age / Math.max(1, maxPoints - 1))));
                }
                const age = now - point.t;
                return Math.max(0, Math.min(1, 1 - (age / windowSeconds)));
            }
            return 1;
        };

        if (trailSettings.display === 'points') {
            const positions = new Float32Array(pointCount * 3);
            const colors = new Float32Array(pointCount * 3);

            for (let i = 0; i < pointCount; i += 1) {
                const point = pointData[i];
                const index = i * 3;
                positions[index] = point.x;
                positions[index + 1] = point.y;
                positions[index + 2] = point.z;

                const alpha = getAlpha(i, point);
                const color = baseTrailColor.current.clone().multiplyScalar(alpha);
                colors[index] = color.r;
                colors[index + 1] = color.g;
                colors[index + 2] = color.b;
            }

            geometry.setAttribute('position', new BufferAttribute(positions, 3));
            geometry.setAttribute('color', new BufferAttribute(colors, 3));
            geometry.setDrawRange(0, pointCount);
            geometry.computeBoundingSphere();
            return;
        }

        const segmentPositions: number[] = [];
        const segmentColors: number[] = [];

        let lastPoint: TrailPoint | null = null;
        let lastIndex = -1;
        let pointIndex = 0;

        for (let i = 0; i < trail.length; i += 1) {
            const marker = trail[i];
            if ('break' in marker) {
                lastPoint = null;
                lastIndex = -1;
                continue;
            }

            const alpha = getAlpha(pointIndex, marker);
            const color = baseTrailColor.current.clone().multiplyScalar(alpha);
            if (lastPoint) {
                const lastColor = baseTrailColor.current.clone().multiplyScalar(getAlpha(lastIndex, lastPoint));
                segmentPositions.push(
                    lastPoint.x, lastPoint.y, lastPoint.z,
                    marker.x, marker.y, marker.z
                );
                segmentColors.push(
                    lastColor.r,
                    lastColor.g,
                    lastColor.b,
                    color.r, color.g, color.b
                );
            }
            lastPoint = marker;
            lastIndex = pointIndex;
            pointIndex += 1;
        }

        const positions = new Float32Array(segmentPositions);
        const colors = new Float32Array(segmentColors);
        const segmentCount = segmentPositions.length / 3;

        geometry.setAttribute('position', new BufferAttribute(positions, 3));
        geometry.setAttribute('color', new BufferAttribute(colors, 3));
        geometry.setDrawRange(0, segmentCount);
        geometry.computeBoundingSphere();
    });

    if (trailSettings.display === 'none') return null;

    return (
        <group>
            {trailSettings.display === 'segments' && (
                <lineSegments>
                    <bufferGeometry ref={lineGeometryRef} />
                    <lineBasicMaterial vertexColors transparent opacity={1} />
                </lineSegments>
            )}
            {trailSettings.display === 'points' && (
                <points>
                    <bufferGeometry ref={pointsGeometryRef} />
                    <pointsMaterial size={0.08} vertexColors transparent opacity={1} sizeAttenuation />
                </points>
            )}
        </group>
    );
};
