import React from 'react';
import { useAppStore, type GeometryEntity, type CoordinateSpace, type PointShape } from '../../store/useAppStore';
import { Line, Sphere, Box, Cone } from '@react-three/drei';
import * as THREE from 'three';
import { telemetryStore } from '../../store/telemetryStore';
// import { useCoordinateMapper } from '../../hooks/useCoordinateMapper'; // We'd need to extract this logic if we want to reuse it easily

// Helper to map coordinates if space is 'plot'
// Since useCoordinateMapper is a hook, we might duplicate the math here or refactor.
// For now, let's implement the basic scaling logic inline or assume the renderer handles it.
// Actually, the PlotBox logic maps:
// X Input -> rangeX -> Visual X
// Y Input -> rangeZ -> Visual Z (Depth)
// Z Input -> rangeY -> Visual Y (Height) (FTC Z is up)

const useCoordinateTransform = (space: CoordinateSpace) => {
    const axes = useAppStore(state => state.axes);

    return (point: [number, number, number]): [number, number, number] => {
        if (space === 'world') {
            // World means "Raw 3D scene units". 
            // BUT, our scene is scaled such that the PlotBox is at 0,0,0 ??
            // Usually "World" in this context means "Raw Data Coordinates" but visualized *without* the PlotBox remapping?
            // Or does checking "World" mean "Use absolute ThreeJS scene coordinates"?
            // User likely means: "Data Coordinates" vs "Plot Coordinates".
            // IF 'world': Render at exactly [x, y, z] in ThreeJS.
            // IF 'plot': Remap [x, y, z] data using the PlotBox axes settings.

            // Wait, previous Robot logic REMAPPED data to visual.
            // If user selects 'World', they probably want the raw positions (maybe for debug), 
            // BUT if the PlotBox is active, 'World' points might be huge or tiny?
            // Let's assume 'World' = Raw ThreeJS coordinates.
            // 'Plot' = Apply PlotBox transform.
            return point;
        }

        // Apply PlotBox Transform (Data -> Visual)
        // Data X -> Visual X
        // Data Y -> Visual Z
        // Data Z -> Visual Y
        const { x: ax, y: ay, z: az } = axes; // az is visual Z (depth), ay is visual Y (height)

        const map = (val: number, range: { min: number, max: number, size: number }) => {
            const pct = (val - range.min) / (range.max - range.min);
            return (pct - 0.5) * range.size;
        };

        // Standard FTC: X=Right, Y=Forward, Z=Up
        // Visual: X=Right, Y=Up, Z=Forward (Depth)
        const visualX = map(point[0], ax);     // Data X -> Visual X
        const visualY = map(point[2], ay);     // Data Z -> Visual Y (Up)
        const visualZ = map(point[1], az);     // Data Y -> Visual Z (Depth)

        return [visualX, visualY, visualZ];
    };
};

// Helper to get clipping planes based on current axes dimensions
const useClippingPlanes = (enabled: boolean) => {
    const axes = useAppStore(state => state.axes);

    return React.useMemo(() => {
        if (!enabled) return [];

        // Visual Bounds are [-size/2, size/2] for each axis
        // We need 6 planes pointing INWARDS
        // Plane equation: normal . point + constant = 0
        // visible if distance > 0 ? No, standard threejs clipping is: keeps pixels where (result > 0) ? 
        // ThreeJS standard: "Objects are clipped (not rendered) on the negative side of the plane."
        // So normal should point OUT of the volume we want to KEEP? 
        // No, standard is: We want to keep the "positive" side.

        // Example: Want x < 5. Plane at 5, normal (-1, 0, 0).
        // Point 4: -1*4 + 5 = 1 (>0, kept). Point 6: -1*6 + 5 = -1 (<0, clipped). Correct.

        const xHalf = axes.x.size / 2;
        const yHalf = axes.y.size / 2; // Visual Y (Height) (mapped from Z data)
        const zHalf = axes.z.size / 2; // Visual Z (Depth) (mapped from Y data)

        return [
            new THREE.Plane(new THREE.Vector3(-1, 0, 0), xHalf),  // Max X
            new THREE.Plane(new THREE.Vector3(1, 0, 0), xHalf),   // Min X
            new THREE.Plane(new THREE.Vector3(0, -1, 0), yHalf),  // Max Y
            new THREE.Plane(new THREE.Vector3(0, 1, 0), yHalf),   // Min Y
            new THREE.Plane(new THREE.Vector3(0, 0, -1), zHalf),  // Max Z
            new THREE.Plane(new THREE.Vector3(0, 0, 1), zHalf)    // Min Z
        ];
    }, [axes, enabled]);
};

const useTelemetryReferences = () => {
    const telemetrySnapshot = React.useSyncExternalStore(
        telemetryStore.subscribe,
        telemetryStore.getState
    ) as Record<string, any>;
    const telemetryKeys = React.useMemo(
        () => Object.keys(telemetrySnapshot).sort((a, b) => a.localeCompare(b)),
        [telemetrySnapshot]
    );

    return { telemetrySnapshot, telemetryKeys };
};

const resolveTelemetryValue = (
    value: any,
    telemetrySnapshot: Record<string, any>,
    telemetryKeys: string[]
) => {
    const evalExpression = (expression: string) => {
        const withRefs = expression.replace(/\$(\d+)/g, (_, rawIndex) => {
            const index = Number(rawIndex) - 1;
            const key = telemetryKeys[index];
            const refValue = key ? Number(telemetrySnapshot[key]) : NaN;
            return Number.isFinite(refValue) ? String(refValue) : '0';
        });
        const prepared = withRefs.replace(/\^/g, '**');
        if (!/^[0-9eE+\-*/().\s]*$/.test(prepared)) return NaN;
        try {
            return Number(Function(`"use strict"; return (${prepared});`)());
        } catch {
            return NaN;
        }
    };

    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return 0;
        const refMatch = trimmed.match(/^\$(\d+)$/);
        if (refMatch) {
            const index = Number(refMatch[1]) - 1;
            const key = telemetryKeys[index];
            const refValue = key ? Number(telemetrySnapshot[key]) : NaN;
            return Number.isFinite(refValue) ? refValue : 0;
        }
        const evaluated = evalExpression(trimmed);
        if (Number.isFinite(evaluated)) return evaluated;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};

const resolveVector3 = (
    value: any,
    telemetrySnapshot: Record<string, any>,
    telemetryKeys: string[]
): [number, number, number] => {
    if (!Array.isArray(value)) return [0, 0, 0];
    return [
        resolveTelemetryValue(value[0], telemetrySnapshot, telemetryKeys),
        resolveTelemetryValue(value[1], telemetrySnapshot, telemetryKeys),
        resolveTelemetryValue(value[2], telemetrySnapshot, telemetryKeys),
    ];
};

// ... existing useCoordinateTransform ...

const PointRenderer = ({
    entity,
    telemetrySnapshot,
    telemetryKeys,
}: {
    entity: GeometryEntity;
    telemetrySnapshot: Record<string, any>;
    telemetryKeys: string[];
}) => {
    if (!entity.visible) return null;
    const { position, radius = 0.5, shape = 'sphere' } = entity.data;
    const [isHovered, setIsHovered] = React.useState(false);
    const setHoveredPoint = useAppStore(state => state.setHoveredPoint);
    const transform = useCoordinateTransform(entity.coordinateSpace);
    const clippingPlanes = useClippingPlanes(!entity.visibleIfOutsideGraph);
    const resolvedPos = resolveVector3(position, telemetrySnapshot, telemetryKeys);
    const finalPos = transform(resolvedPos);

    const commonProps = {
        args: [radius, 16, 16] as any,
    };
    React.useEffect(() => {
        if (isHovered) {
            setHoveredPoint({ id: entity.id, name: entity.name, coords: resolvedPos });
        }
    }, [entity.id, entity.name, isHovered, resolvedPos, setHoveredPoint]);

    const material = (
        <meshStandardMaterial
            color={entity.color}
            transparent
            opacity={entity.opacity}
            clippingPlanes={clippingPlanes}
            clipShadows
        />
    );

    const handleOver = (event: any) => {
        event.stopPropagation();
        setIsHovered(true);
    };
    const handleOut = (event: any) => {
        event.stopPropagation();
        setIsHovered(false);
        setHoveredPoint(null);
    };

    return (
        <group position={new THREE.Vector3(...finalPos)}>
            {shape === 'box' && (
                <Box
                    args={[radius * 2, radius * 2, radius * 2]}
                    onPointerOver={handleOver}
                    onPointerOut={handleOut}
                >
                    {material}
                </Box>
            )}
            {shape === 'cone' && (
                <Cone
                    args={[radius, radius * 2, 16]}
                    onPointerOver={handleOver}
                    onPointerOut={handleOut}
                >
                    {material}
                </Cone>
            )}
            {shape === 'sphere' && (
                <Sphere
                    args={commonProps.args}
                    onPointerOver={handleOver}
                    onPointerOut={handleOut}
                >
                    {material}
                </Sphere>
            )}
        </group>
    );
};

const LineRenderer = ({
    entity,
    telemetrySnapshot,
    telemetryKeys,
}: {
    entity: GeometryEntity;
    telemetrySnapshot: Record<string, any>;
    telemetryKeys: string[];
}) => {
    if (!entity.visible) return null;
    const { start, end, thickness = 2, style = 'solid', dashSize = 1, gapSize = 0.5 } = entity.data;
    const transform = useCoordinateTransform(entity.coordinateSpace);
    const clippingPlanes = useClippingPlanes(!entity.visibleIfOutsideGraph);

    // Transform start/end
    const p1 = new THREE.Vector3(...transform(resolveVector3(start, telemetrySnapshot, telemetryKeys)));
    const p2 = new THREE.Vector3(...transform(resolveVector3(end, telemetrySnapshot, telemetryKeys)));

    // NOTE: Drei Line wrapping Line2 may not support standard clippingPlanes prop directly on the component 
    // depending on version, but usually does via material-clippingPlanes. 
    // However, Drei Line creates its own material. We might need to attach to existing material logic ??
    // Actually, Line from drei accepts '...props'. Pushing clippingPlanes might work if it forwards to material?
    // If not, we might need a distinct solution. For now, try passing it.
    // If it fails, lines will just ignore clipping.

    return (
        <Line
            points={[p1, p2]}
            color={entity.color}
            lineWidth={thickness}
            dashed={style === 'dashed'}
            dashScale={1}
            dashSize={dashSize}
            gapSize={gapSize}
            transparent
            opacity={entity.opacity}
            // @ts-ignore
            clippingPlanes={clippingPlanes}
        />
    );
};

const CubicBezierRenderer = ({
    entity,
    telemetrySnapshot,
    telemetryKeys,
}: {
    entity: GeometryEntity;
    telemetrySnapshot: Record<string, any>;
    telemetryKeys: string[];
}) => {
    if (!entity.visible) return null;
    const {
        start,
        control1,
        control2,
        end,
        thickness = 2,
        style = 'solid',
        dashSize = 1,
        gapSize = 0.5
    } = entity.data;
    const transform = useCoordinateTransform(entity.coordinateSpace);
    const clippingPlanes = useClippingPlanes(!entity.visibleIfOutsideGraph);

    const curvePoints = React.useMemo(() => {
        const curve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(...transform(resolveVector3(start, telemetrySnapshot, telemetryKeys))),
            new THREE.Vector3(...transform(resolveVector3(control1, telemetrySnapshot, telemetryKeys))),
            new THREE.Vector3(...transform(resolveVector3(control2, telemetrySnapshot, telemetryKeys))),
            new THREE.Vector3(...transform(resolveVector3(end, telemetrySnapshot, telemetryKeys)))
        );
        return curve.getPoints(50);
    }, [start, control1, control2, end, transform, telemetrySnapshot, telemetryKeys]);

    return (
        <Line
            points={curvePoints}
            color={entity.color}
            lineWidth={thickness}
            dashed={style === 'dashed'}
            dashScale={1}
            dashSize={dashSize}
            gapSize={gapSize}
            transparent
            opacity={entity.opacity}
            // @ts-ignore
            clippingPlanes={clippingPlanes}
        />
    );
};

const PlaneRenderer = ({
    entity,
    telemetrySnapshot,
    telemetryKeys,
}: {
    entity: GeometryEntity;
    telemetrySnapshot: Record<string, any>;
    telemetryKeys: string[];
}) => {
    if (!entity.visible) return null;
    const { normal = [0, 0, 1], constant = 0, size = 10 } = entity.data;
    const clippingPlanes = useClippingPlanes(!entity.visibleIfOutsideGraph);
    const transform = useCoordinateTransform(entity.coordinateSpace);
    const resolvedNormal = resolveVector3(normal, telemetrySnapshot, telemetryKeys);
    const resolvedConstant = resolveTelemetryValue(constant, telemetrySnapshot, telemetryKeys);
    const resolvedSize = resolveTelemetryValue(size, telemetrySnapshot, telemetryKeys);

    // Visual Normal mapping: Data X,Y,Z -> Visual X,Z,Y
    // Actually, let's treat normal as a vector in data space.
    // E.g. Normal [0,0,1] means Z=Up in FTC coordinates.
    // Visual Y is Up. So Visual Normal should be [0,1,0].

    // For simplicity, let's assume Plane is a bounded square for now.
    // We compute the center point if we had one? Plane doesn't usually have a center.
    // But THREE.Plane is infinite. 
    // To render it, we need a Mesh.

    const [vx, vy, vz] = transform([0, 0, 0]); // Offset transform
    // This is tricky because transform is non-linear (min-max).
    // Let's assume for now Plane is world-space or simple.

    // To orient the plane mesh along the normal, we can use lookAt or quaternion
    // Standard Plane mesh is at [0,0,1] normal (facing +Z in ThreeJS)
    const normVec = new THREE.Vector3(...resolvedNormal).normalize();
    // Visual axes: FTC UP (Z) is Visual UP (Y).
    // If user enters normal [0,0,1], they mean UP. 
    // We should map this normal too?
    // Let's assume the user enters normal in DATA space.
    const [vnx, vny, vnz] = [normVec.x, normVec.z, normVec.y]; // Data X,Y,Z -> Visual X,Z,Y (but Y is height)
    const visualNormal = new THREE.Vector3(vnx, vny, vnz);

    return (
        <group position={[vx, vy, vz]}>
            <mesh
                onUpdate={(self) => self.lookAt(visualNormal.clone().add(self.position))}
                position={[
                    visualNormal.x * resolvedConstant,
                    visualNormal.y * resolvedConstant,
                    visualNormal.z * resolvedConstant,
                ]}
            >
                <planeGeometry args={[resolvedSize, resolvedSize]} />
                <meshStandardMaterial
                    color={entity.color}
                    transparent
                    opacity={entity.opacity}
                    side={THREE.DoubleSide}
                    clippingPlanes={clippingPlanes}
                />
            </mesh>
        </group>
    );
};

const ParametricRenderer = ({
    entity,
    telemetrySnapshot,
    telemetryKeys,
}: {
    entity: GeometryEntity;
    telemetrySnapshot: Record<string, any>;
    telemetryKeys: string[];
}) => {
    if (!entity.visible) return null;
    const { equation, domain } = entity.data;
    const clippingPlanes = useClippingPlanes(!entity.visibleIfOutsideGraph);
    const transform = useCoordinateTransform(entity.coordinateSpace);
    const axes = useAppStore(state => state.axes);

    const geometry = React.useMemo(() => {
        const count = 50;
        const geom = new THREE.BufferGeometry();
        const positions = [];
        const indices = [];
        const rawU = Array.isArray(domain?.u) ? domain.u : [0, 1];
        const rawV = Array.isArray(domain?.v) ? domain.v : [0, 1];
        const uMin = resolveTelemetryValue(rawU[0], telemetrySnapshot, telemetryKeys);
        const uMax = resolveTelemetryValue(rawU[1], telemetrySnapshot, telemetryKeys);
        const vMin = resolveTelemetryValue(rawV[0], telemetrySnapshot, telemetryKeys);
        const vMax = resolveTelemetryValue(rawV[1], telemetrySnapshot, telemetryKeys);

        let funcX: Function, funcY: Function, funcZ: Function;

        const substituteTelemetryRefs = (input: string) => (
            input.replace(/\$(\d+)/g, (_, rawIndex) => {
                const index = Number(rawIndex) - 1;
                const key = telemetryKeys[index];
                const refValue = key ? Number(telemetrySnapshot[key]) : NaN;
                return Number.isFinite(refValue) ? String(refValue) : '0';
            })
        );
        const mathRegex = /\b(sin|cos|tan|asin|acos|atan|atan2|pow|exp|log|sqrt|abs|floor|ceil|round|min|max|PI|E|sqrt2)\b/g;
        const prepare = (s: string) => s.replace(mathRegex, 'Math.$1');
        const insertImplicitMultiplication = (s: string) => {
            let next = s;
            next = next.replace(/(\d|\))\s*(?=Math\.|[A-Za-z(])(?![eE][+-]?\d)/g, '$1*');
            next = next.replace(/([A-Za-z\)])\s*(?=\d|\()/g, '$1*');
            return next;
        };
        const prepareEquation = (s: string) => {
            const substituted = substituteTelemetryRefs(s).replace(/\^/g, '**');
            return insertImplicitMultiplication(prepare(substituted));
        };

        if (typeof equation === 'string') {
            funcX = (u: number, _v: number) => u;
            funcY = (_u: number, v: number) => v;
            funcZ = new Function('x', 'y', `try { return ${prepareEquation(equation)}; } catch(e) { return 0; }`);
        } else {
            funcX = new Function('u', 'v', `try { return ${prepareEquation(equation.x)}; } catch(e) { return 0; }`);
            funcY = new Function('u', 'v', `try { return ${prepareEquation(equation.y)}; } catch(e) { return 0; }`);
            funcZ = new Function('u', 'v', `try { return ${prepareEquation(equation.z)}; } catch(e) { return 0; }`);
        }

        for (let i = 0; i <= count; i++) {
            const u = uMin + (uMax - uMin) * (i / count);
            for (let j = 0; j <= count; j++) {
                const v = vMin + (vMax - vMin) * (j / count);
                const dx = funcX(u, v);
                const dy = funcY(u, v);
                const dz = funcZ(u, v);
                const safeX = Number.isFinite(dx) ? dx : 0;
                const safeY = Number.isFinite(dy) ? dy : 0;
                const safeZ = Number.isFinite(dz) ? dz : 0;
                const [vx, vy, vz] = transform([safeX, safeY, safeZ]);
                positions.push(
                    Number.isFinite(vx) ? vx : 0,
                    Number.isFinite(vy) ? vy : 0,
                    Number.isFinite(vz) ? vz : 0
                );
            }
        }

        for (let i = 0; i < count; i++) {
            for (let j = 0; j < count; j++) {
                const a = i * (count + 1) + j;
                const b = i * (count + 1) + j + 1;
                const c = (i + 1) * (count + 1) + j + 1;
                const d = (i + 1) * (count + 1) + j;
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geom.setIndex(indices);
        geom.computeVertexNormals();
        return geom;
    }, [equation, domain, axes, transform, telemetrySnapshot, telemetryKeys]);

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial
                color={entity.color}
                transparent
                opacity={entity.opacity}
                side={THREE.DoubleSide}
                clippingPlanes={clippingPlanes}
            />
        </mesh>
    );
};

// Recursive Group Renderer
const GroupRenderer = ({
    groupId,
    visibleFromParent = true,
    telemetrySnapshot,
    telemetryKeys,
}: {
    groupId: string;
    visibleFromParent?: boolean;
    telemetrySnapshot: Record<string, any>;
    telemetryKeys: string[];
}) => {
    const group = useAppStore(state => state.groups[groupId]);
    if (!group) return null;
    const isVisible = visibleFromParent && group.visible;

    return (
        <group>
            {group.childrenEntities.map(childId => (
                <EntityDispatcher
                    key={childId}
                    entityId={childId}
                    parentVisible={isVisible}
                    telemetrySnapshot={telemetrySnapshot}
                    telemetryKeys={telemetryKeys}
                />
            ))}
            {group.childrenGroups.map(childGroupId => (
                <GroupRenderer
                    key={childGroupId}
                    groupId={childGroupId}
                    visibleFromParent={isVisible}
                    telemetrySnapshot={telemetrySnapshot}
                    telemetryKeys={telemetryKeys}
                />
            ))}
        </group>
    );
};

const EntityDispatcher = ({
    entityId,
    parentVisible,
    telemetrySnapshot,
    telemetryKeys,
}: {
    entityId: string;
    parentVisible: boolean;
    telemetrySnapshot: Record<string, any>;
    telemetryKeys: string[];
}) => {
    const entity = useAppStore(state => state.entities[entityId]);
    if (!entity) return null;
    if (!parentVisible || !entity.visible) return null;

    switch (entity.type) {
        case 'point': return <PointRenderer entity={entity} telemetrySnapshot={telemetrySnapshot} telemetryKeys={telemetryKeys} />;
        case 'line': return <LineRenderer entity={entity} telemetrySnapshot={telemetrySnapshot} telemetryKeys={telemetryKeys} />;
        case 'cubic-bezier': return <CubicBezierRenderer entity={entity} telemetrySnapshot={telemetrySnapshot} telemetryKeys={telemetryKeys} />;
        case 'parametric': return <ParametricRenderer entity={entity} telemetrySnapshot={telemetrySnapshot} telemetryKeys={telemetryKeys} />;
        case 'plane': return <PlaneRenderer entity={entity} telemetrySnapshot={telemetrySnapshot} telemetryKeys={telemetryKeys} />;
        default: return null;
    }
};

export const GeometryRenderer = () => {
    const rootGroupIds = useAppStore(state => state.rootGroupIds);
    const rootEntityIds = useAppStore(state => state.rootEntityIds);
    const { telemetrySnapshot, telemetryKeys } = useTelemetryReferences();

    return (
        <group>
            {rootGroupIds.map(groupId => (
                <GroupRenderer
                    key={groupId}
                    groupId={groupId}
                    telemetrySnapshot={telemetrySnapshot}
                    telemetryKeys={telemetryKeys}
                />
            ))}
            {rootEntityIds.map(entityId => (
                <EntityDispatcher
                    key={entityId}
                    entityId={entityId}
                    parentVisible={true}
                    telemetrySnapshot={telemetrySnapshot}
                    telemetryKeys={telemetryKeys}
                />
            ))}
        </group>
    );
};
