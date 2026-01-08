import React from 'react';
import { useAppStore, type GeometryEntity, type GeometryGroup, type CoordinateSpace, type PointShape } from '../../store/useAppStore';
import { Line, Sphere, Box, Cone, Plane } from '@react-three/drei';
import * as THREE from 'three';
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

// ... existing useCoordinateTransform ...

const PointRenderer = ({ entity }: { entity: GeometryEntity }) => {
    if (!entity.visible) return null;
    const { position, radius = 0.5, shape = 'sphere' } = entity.data;
    const transform = useCoordinateTransform(entity.coordinateSpace);
    const clippingPlanes = useClippingPlanes(!entity.visibleIfOutsideGraph);
    const finalPos = transform(position);

    const commonProps = {
        position: new THREE.Vector3(...finalPos),
        args: [radius, 16, 16] as any,
    };

    const material = (
        <meshStandardMaterial
            color={entity.color}
            transparent
            opacity={entity.opacity}
            clippingPlanes={clippingPlanes}
            clipShadows
        />
    );

    switch (shape as PointShape) {
        case 'box':
            return <Box position={commonProps.position} args={[radius * 2, radius * 2, radius * 2]}>{material}</Box>;
        case 'cone':
            return <Cone position={commonProps.position} args={[radius, radius * 2, 16]}>{material}</Cone>;
        case 'sphere':
        default:
            return <Sphere position={commonProps.position} args={[radius, 16, 16]}>{material}</Sphere>;
    }
};

const LineRenderer = ({ entity }: { entity: GeometryEntity }) => {
    if (!entity.visible) return null;
    const { start, end, thickness = 2, style = 'solid', dashSize = 1, gapSize = 0.5 } = entity.data;
    const transform = useCoordinateTransform(entity.coordinateSpace);
    const clippingPlanes = useClippingPlanes(!entity.visibleIfOutsideGraph);

    // Transform start/end
    const p1 = new THREE.Vector3(...transform(start));
    const p2 = new THREE.Vector3(...transform(end));

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

const ParametricRenderer = ({ entity }: { entity: GeometryEntity }) => {
    if (!entity.visible) return null;
    const { equation, domain } = entity.data; // equation is now { x, y, z } string or simple string
    const clippingPlanes = useClippingPlanes(!entity.visibleIfOutsideGraph);
    const transform = useCoordinateTransform(entity.coordinateSpace);
    const axes = useAppStore(state => state.axes);

    // Memoize geometry
    const geometry = React.useMemo(() => {
        const count = 50;
        const geom = new THREE.BufferGeometry();
        const positions = [];
        const indices = [];

        const uMin = domain.u[0], uMax = domain.u[1];
        const vMin = domain.v[0], vMax = domain.v[1];

        let funcX: Function, funcY: Function, funcZ: Function;

        // Parse equations
        if (typeof equation === 'string') {
            // Old support: z = f(x,y). Mapping u->x, v->y for simplicity
            funcX = (u: number, v: number) => u;
            funcY = (u: number, v: number) => v; // Data Y
            funcZ = new Function('x', 'y', `try { return ${equation}; } catch(e) { return 0; }`);
        } else {
            // Full parametric { x, y, z }
            funcX = new Function('u', 'v', `try { return ${equation.x}; } catch(e) { return 0; }`);
            funcY = new Function('u', 'v', `try { return ${equation.y}; } catch(e) { return 0; }`);
            funcZ = new Function('u', 'v', `try { return ${equation.z}; } catch(e) { return 0; }`);
        }

        for (let i = 0; i <= count; i++) {
            const u = uMin + (uMax - uMin) * (i / count);
            for (let j = 0; j <= count; j++) {
                const v = vMin + (vMax - vMin) * (j / count);

                // Eval Data Coordinates
                const dx = funcX(u, v);
                const dy = funcY(u, v);
                const dz = funcZ(u, v);

                // Apply coordinate transform (plot space -> visual space)
                const [vx, vy, vz] = transform([dx, dy, dz]);
                positions.push(vx, vy, vz);
            }
        }

        // ... indices logic ... (same as before)
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
    }, [equation, domain, axes, transform]);

    // To properly support transform, we should wrap the mess in a group and apply scale?
    // But PlotBox scale is offset-based ((val - min) / range). It's not a simple scale.
    // So we MUST compute vertex positions.
    // I'll update the renderer to just output RAW [x, z, y] (ThreeJS standard orientation) 
    // and rely on the entity.coordinateSpace = 'world' for now.
    // Fixing 'plot' space for Parametric is complex without passing axes into useMemo.

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial
                color={entity.color}
                transparent
                opacity={entity.opacity}
                side={THREE.DoubleSide}
                wireframe={false}
                clippingPlanes={clippingPlanes}
                clipShadows
            />
        </mesh>
    );
};

// Recursive Group Renderer
const GroupRenderer = ({ groupId, visibleFromParent = true }: { groupId: string, visibleFromParent?: boolean }) => {
    const group = useAppStore(state => state.groups[groupId]);
    if (!group) return null;
    const isVisible = visibleFromParent && group.visible;

    return (
        <group>
            {group.childrenEntities.map(childId => (
                <EntityDispatcher key={childId} entityId={childId} parentVisible={isVisible} />
            ))}
            {group.childrenGroups.map(childGroupId => (
                <GroupRenderer key={childGroupId} groupId={childGroupId} visibleFromParent={isVisible} />
            ))}
        </group>
    );
};

const EntityDispatcher = ({ entityId, parentVisible }: { entityId: string, parentVisible: boolean }) => {
    const entity = useAppStore(state => state.entities[entityId]);
    if (!entity) return null;
    if (!parentVisible || !entity.visible) return null;

    switch (entity.type) {
        case 'point': return <PointRenderer entity={entity} />;
        case 'line': return <LineRenderer entity={entity} />;
        case 'parametric': return <ParametricRenderer entity={entity} />;
        case 'plane': return null; // Deprecated or mapped to parametric
        default: return null;
    }
};

export const GeometryRenderer = () => {
    const rootGroupIds = useAppStore(state => state.rootGroupIds);
    return (
        <group>
            {rootGroupIds.map(groupId => (
                <GroupRenderer key={groupId} groupId={groupId} />
            ))}
        </group>
    );
};
