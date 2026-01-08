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
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent scrolling with Space/Arrow keys if in free mode (and assumed locked)
            // We check if keys.current is relevant or just generally prevent default for movement keys
            if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {

                // Only if we are in free mode... but useEffect closure has stale state?
                // We need to use a ref or check the store closer. 
                // Or just rely on the fact that if we are focused on canvas, we probably want to prevent default.
                // But better: check valid keys.
                // We'll trust that blocking these keys globally when this component is mounted is okay? 
                // No, CameraManager is always mounted. We must check mode.
                // We can't access 'cameraMode' from prop in this effect without re-binding.
                // Ideally we bind handlers in useFrame or check a Ref for mode.
                e.preventDefault();
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
    }, []); // Empty dep array -> one time bind. BUT we need mode check.

    // Actually, let's re-bind or use a Ref for mode.
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
