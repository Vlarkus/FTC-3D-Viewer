import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { telemetryStore } from '../../store/telemetryStore';
import { useCoordinateMapper } from '../../hooks/useCoordinateMapper';

export const Robot = () => {
    const meshRef = useRef<Mesh>(null);
    const { mapPoint } = useCoordinateMapper(); // New hook for scaling

    useFrame(() => {
        if (!meshRef.current) return;

        // Transient update
        const { x, y, z, heading } = telemetryStore.getState();

        // New: Map data coordinates to visual coordinates
        const [vx, vy, vz] = mapPoint(x, y, z);

        // Update Position
        meshRef.current.position.set(vx, vy, vz);

        // Update Rotation (Heading)
        meshRef.current.rotation.y = heading;
    });

    return (
        <mesh ref={meshRef} castShadow>
            <boxGeometry args={[0.45, 0.45, 0.45]} /> {/* 18 inch robot approx 0.45m */}
            <meshStandardMaterial color="#8844ff" />
            {/* Direction indicator */}
            <mesh position={[0.2, 0, 0]}>
                <boxGeometry args={[0.2, 0.1, 0.1]} />
                <meshStandardMaterial color="white" />
            </mesh>
        </mesh>
    );
};
