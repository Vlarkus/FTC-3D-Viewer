import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { Robot } from './Robot';
import { FieldGrid } from './Grid';
import { Primitives } from './Primitives';

export const Scene: React.FC = () => {
    const { cameraMode, showGrid } = useAppStore();

    return (
        <Canvas
            camera={{ position: [2, 2, 2], fov: 50 }}
            className="w-full h-full block"
            shadows
        >
            <OrbitControls makeDefault enabled={cameraMode !== 'follow'} />

            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight
                position={[5, 10, 5]}
                intensity={1}
                castShadow
            />
            <Environment preset="city" />

            {/* World */}
            {showGrid && <FieldGrid />}
            <axesHelper args={[1]} />

            {/* Entities */}
            <Robot />
            <Primitives />

            {/* Background */}
            <color attach="background" args={['#050505']} />
        </Canvas>
    );
};
