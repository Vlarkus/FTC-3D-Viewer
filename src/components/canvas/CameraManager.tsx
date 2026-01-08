import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PointerLockControls } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { telemetryStore } from '../../store/telemetryStore';
import * as THREE from 'three';

export const CameraManager = () => {
    const { cameraMode, orbitTarget, cameraSpeed } = useAppStore();
    const orbitRef = useRef<any>(null);
    const { camera } = useThree();

    // Movement State
    const keys = useRef<{ [key: string]: boolean }>({});

    // Keyboard Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useFrame((_, delta) => {
        // Handle Orbit Tracking
        if (cameraMode === 'orbit' && orbitTarget === 'robot' && orbitRef.current) {
            const { x, y, z } = telemetryStore.getState();
            // Assuming direct mapping for now as per previous logic
            orbitRef.current.target.set(x, z, y);
            orbitRef.current.update();
        } else if (cameraMode === 'orbit' && orbitTarget === 'origin' && orbitRef.current) {
            orbitRef.current.target.set(0, 0, 0);
            orbitRef.current.update();
        }

        // Handle Free Cam Movement
        if (cameraMode === 'free') {
            const moveSpeed = cameraSpeed * delta;

            if (keys.current['KeyW']) camera.translateZ(-moveSpeed);
            if (keys.current['KeyS']) camera.translateZ(moveSpeed);
            if (keys.current['KeyA']) camera.translateX(-moveSpeed);
            if (keys.current['KeyD']) camera.translateX(moveSpeed);

            // Global Up/Down
            if (keys.current['Space']) camera.position.y += moveSpeed;
            if (keys.current['ShiftLeft'] || keys.current['ShiftRight']) camera.position.y -= moveSpeed;
        }
    });

    // Reset camera when switching modes
    useEffect(() => {
        if (cameraMode === 'free') {
            // Optional: Start at a reasonable position if needed, or keep current
        } else {
            // Force unlock when leaving free mode
            document.exitPointerLock();
        }
    }, [cameraMode, camera]);

    return (
        <>
            {cameraMode === 'orbit' && (
                <OrbitControls
                    ref={orbitRef}
                    makeDefault
                    enableDamping
                />
            )}

            {cameraMode === 'free' && (
                <PointerLockControls
                    makeDefault
                    selector="#canvas-container" // Only lock when clicking the 3D view
                />
            )}
        </>
    );
};
