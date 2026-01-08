import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { telemetryStore } from '../../store/telemetryStore';
import { useCoordinateMapper } from '../../hooks/useCoordinateMapper';
import { useAppStore } from '../../store/useAppStore';

export const Robot = () => {
    const meshRef = useRef<Mesh>(null);
    const { mapPoint } = useCoordinateMapper();
    const telemetryMapping = useAppStore(state => state.telemetryMapping);

    useFrame(() => {
        if (!meshRef.current) return;

        const rawData = telemetryStore.getState() as any;

        // Resolve coordinates based on mapping
        const x = telemetryMapping.x ? (rawData[telemetryMapping.x] ?? 0) : 0;
        const y = telemetryMapping.y ? (rawData[telemetryMapping.y] ?? 0) : 0;
        const z = telemetryMapping.z ? (rawData[telemetryMapping.z] ?? 0) : 0;
        const heading = rawData.heading ?? 0;

        // Map data coordinates to visual coordinates
        const [vx, vy, vz] = mapPoint(x, y, z);

        // Update Position
        meshRef.current.position.set(vx, vy, vz);

        // Update Rotation (Heading)
        meshRef.current.rotation.y = heading;
    });

    return (
        <mesh ref={meshRef} castShadow>
            <sphereGeometry args={[0.2, 32, 32]} />
            <meshStandardMaterial color="#800000" />
            {/* Direction indicator (small box) */}
            <mesh position={[0.15, 0, 0]}>
                <boxGeometry args={[0.1, 0.05, 0.05]} />
                <meshStandardMaterial color="white" />
            </mesh>
        </mesh>
    );
};
