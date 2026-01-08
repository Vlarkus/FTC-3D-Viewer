import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { Robot } from './Robot';
import { PlotBox } from './PlotBox';
import { CameraManager } from './CameraManager';
import { GeometryRenderer } from './GeometryRenderer';
import { RobotTrail } from './RobotTrail';

export const Scene = () => {
    const { showGrid } = useAppStore();

    return (
        <Canvas
            id="canvas-container"
            camera={{ position: [0, 5, 10], fov: 50 }}
            className="w-full h-full block"
            shadows
            gl={{ localClippingEnabled: true }}
        >
            <CameraManager />

            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight
                position={[5, 10, 5]}
                intensity={1}
                castShadow
            />
            <Environment preset="city" />

            {/* World */}
            {showGrid && <PlotBox />}

            {/* Entities */}
            <Robot />
            <RobotTrail />
            <GeometryRenderer />

            {/* Background */}
            <color attach="background" args={['#050505']} />
        </Canvas>
    );
};
