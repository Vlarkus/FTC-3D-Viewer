import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { telemetryStore } from '../../store/telemetryStore';
import { useAppStore } from '../../store/useAppStore';

export const Robot = () => {
    const meshRef = useRef<Mesh>(null);
    const { cameraMode } = useAppStore();

    useFrame((state) => {
        if (!meshRef.current) return;

        // Transient update: Read directly from store without re-rendering React
        const { x, y, z, heading } = telemetryStore.getState();

        // Update Position
        meshRef.current.position.set(x, z, y); // Swapping Y/Z because FTC often uses Z-up, Three uses Y-up. Or standard X/Y ground. 
        // Let's assume Z is Up in input, and Y is Up in WebGL. 
        // actually, standard math plots often have Z up. R3F has Y up default.
        // Let's map Input Z -> Output Y. Input Y -> Output -Z?
        // For now, let's map directly: x->x, y->y, z->z. We can fix coordinates later.
        // Actually, let's stick to X/Y ground plane since that's what grids usually do here.
        // So z -> y (height).

        // meshRef.current.position.set(x, z, -y); // Example mapping
        meshRef.current.position.set(x, y, z); // Simple Mapping

        // Update Rotation (Heading)
        meshRef.current.rotation.y = heading;

        // Camera follow logic
        if (cameraMode === 'follow') {
            const offset = 5;
            state.camera.position.lerp({ x: x + offset, y: y + offset, z: z + offset } as any, 0.1);
            state.camera.lookAt(x, y, z);
        }
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
