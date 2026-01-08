import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Html, Line } from '@react-three/drei';
import { telemetryStore } from '../../store/telemetryStore';
import { useCoordinateMapper } from '../../hooks/useCoordinateMapper';
import { useAppStore } from '../../store/useAppStore';

export const Robot = () => {
    const meshRef = useRef<Mesh>(null);
    const { mapPoint } = useCoordinateMapper();
    const telemetryMapping = useAppStore(state => state.telemetryMapping);
    const { robotSettings, axes, showGrid } = useAppStore();

    // State for UI elements that need React re-renders (Html, Lines)
    const [state, setState] = useState({
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        isInside: false
    });

    useFrame(() => {
        const rawData = telemetryStore.getState() as any;

        // Resolve coordinates
        const x = telemetryMapping.x ? (rawData[telemetryMapping.x] ?? 0) : 0;
        const y = telemetryMapping.y ? (rawData[telemetryMapping.y] ?? 0) : 0;
        const z = telemetryMapping.z ? (rawData[telemetryMapping.z] ?? 0) : 0;
        const heading = rawData.heading ?? 0;

        // Map to visual coordinates
        const [vx, vy, vz] = mapPoint(x, y, z);

        // Update Physics/Mesh directly (high performance)
        if (meshRef.current) {
            meshRef.current.position.set(vx, vy, vz);
            meshRef.current.rotation.y = heading;
        }

        // Check if inside bounds
        const isInside =
            x >= axes.x.min && x <= axes.x.max &&
            y >= axes.y.min && y <= axes.y.max &&
            z >= axes.z.min && z <= axes.z.max;

        // Sync React state for labels and projection lines
        if (state.vx !== vx || state.vy !== vy || state.vz !== vz) {
            setState({ x, y, z, vx, vy, vz, isInside });
        }
    });

    if (!robotSettings.showRobot) return null;

    return (
        <group>
            {/* Robot Dot */}
            <mesh ref={meshRef} castShadow>
                <sphereGeometry args={[0.2, 32, 32]} />
                <meshStandardMaterial color="#800000" />

                {/* Direction indicator */}
                <mesh position={[0.15, 0, 0]}>
                    <boxGeometry args={[0.1, 0.05, 0.05]} />
                    <meshStandardMaterial color="white" />
                </mesh>

                {/* Coordinate Label */}
                {robotSettings.showCoordinates && (
                    <Html distanceFactor={10} position={[0, 0.4, 0]}>
                        <div className="bg-black/80 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap border border-white/20 font-mono shadow-xl pointer-events-none transition-all">
                            ({state.x.toFixed(1)}, {state.y.toFixed(1)}, {state.z.toFixed(1)})
                        </div>
                    </Html>
                )}
            </mesh>

            {/* Projection Lines */}
            {robotSettings.showProjections && state.isInside && showGrid && (
                <group>
                    {/* Line to Floor (Vertical Y axis) */}
                    <Line
                        points={[[state.vx, -axes.y.size / 2, state.vz], [state.vx, state.vy, state.vz]]}
                        color="white"
                        lineWidth={1}
                        transparent
                        opacity={0.3}
                        dashed
                    />
                    {/* Line to Side Wall (Horizontal X axis) */}
                    <Line
                        points={[[-axes.x.size / 2, state.vy, state.vz], [state.vx, state.vy, state.vz]]}
                        color="white"
                        lineWidth={1}
                        transparent
                        opacity={0.3}
                        dashed
                    />
                    {/* Line to Back Wall (Depth Z axis) */}
                    <Line
                        points={[[state.vx, state.vy, -axes.z.size / 2], [state.vx, state.vy, state.vz]]}
                        color="white"
                        lineWidth={1}
                        transparent
                        opacity={0.3}
                        dashed
                    />
                </group>
            )}
        </group>
    );
};
