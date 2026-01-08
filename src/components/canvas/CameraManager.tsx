import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PointerLockControls } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { telemetryStore } from '../../store/telemetryStore';
import { useCoordinateMapper } from '../../hooks/useCoordinateMapper';
import * as THREE from 'three';

export const CameraManager = () => {
    const { cameraMode, orbitTarget, cameraSpeed } = useAppStore();
    const orbitRef = useRef<any>(null);
    const { camera } = useThree();
    const { mapPoint } = useCoordinateMapper();

    // Movement State
    const keys = useRef<{ [key: string]: boolean }>({});

    // For smooth transitions
    const desiredTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

    // Keyboard Listeners
    const modeRef = useRef(cameraMode);
    useEffect(() => { modeRef.current = cameraMode; }, [cameraMode]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (modeRef.current === 'free') {
                if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
                    e.preventDefault();
                }
            }
            keys.current[e.code] = true;
        };
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
        if (cameraMode === 'orbit' && orbitRef.current) {
            if (orbitTarget === 'robot') {
                const { x, y, z } = telemetryStore.getState();
                const [vx, vy, vz] = mapPoint(x, y, z);
                desiredTarget.set(vx, vy, vz);
            } else {
                desiredTarget.set(0, 0, 0);
            }

            // Smoothly move the target
            // Using a factor that feels good (higher = snappier, lower = smoother)
            const smoothingFactor = delta * 10;
            const factor = Math.min(1, smoothingFactor);
            orbitRef.current.target.lerp(desiredTarget, factor);
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

    // Handle Mode Switches
    useEffect(() => {
        if (cameraMode !== 'free') {
            document.exitPointerLock();
        }
    }, [cameraMode]);

    // Speed Control (Scroll Wheel)
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (cameraMode === 'free') {
                const delta = e.deltaY;
                const speedChange = delta > 0 ? -1 : 1; // Scroll up = Faster, Down = Slower
                const newSpeed = Math.max(1, Math.min(100, cameraSpeed + speedChange));
                useAppStore.getState().setCameraSpeed(newSpeed);
            }
        };

        window.addEventListener('wheel', handleWheel);
        return () => window.removeEventListener('wheel', handleWheel);
    }, [cameraMode, cameraSpeed]);

    return (
        <>
            {cameraMode === 'orbit' && (
                <OrbitControls
                    ref={orbitRef}
                    makeDefault
                    enableDamping
                    mouseButtons={{
                        LEFT: THREE.MOUSE.ROTATE,
                        MIDDLE: THREE.MOUSE.DOLLY,
                        RIGHT: THREE.MOUSE.ROTATE
                    }}
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
