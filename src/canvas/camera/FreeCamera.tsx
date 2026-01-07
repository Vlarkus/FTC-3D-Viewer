import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export const FreeCamera: React.FC = () => {
  const { camera, gl: canvas } = useThree();

  // All refs at top level
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const mouseDown = useRef(false);
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false,
  });
  const yawObject = useRef<THREE.Object3D>(new THREE.Object3D());
  const pitchObject = useRef<THREE.Object3D>(new THREE.Object3D());

  // Input handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, keyof typeof keys.current> = {
        KeyW: "w",
        KeyA: "a",
        KeyS: "s",
        KeyD: "d",
        Space: "space",
        ShiftLeft: "shift",
        ShiftRight: "shift",
      };
      const key = keyMap[e.code];
      if (key) {
        keys.current[key] = true;
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyMap: Record<string, keyof typeof keys.current> = {
        KeyW: "w",
        KeyA: "a",
        KeyS: "s",
        KeyD: "d",
        Space: "space",
        ShiftLeft: "shift",
        ShiftRight: "shift",
      };
      const key = keyMap[e.code];
      if (key) {
        keys.current[key] = false;
        e.preventDefault();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 0) {
        // Left mouse
        mouseDown.current = true;
        canvas.domElement.requestPointerLock();
      }
    };

    const handlePointerUp = () => {
      mouseDown.current = false;
      document.exitPointerLock();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (
        mouseDown.current &&
        document.pointerLockElement === canvas.domElement
      ) {
        // YAW: Horizontal mouse
        yawObject.current.rotation.y -= e.movementX * 0.002;

        // PITCH: Vertical mouse (clamped)
        pitchObject.current.rotation.x -= e.movementY * 0.002;
        pitchObject.current.rotation.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, pitchObject.current.rotation.x)
        );

        // Correct rotation math
        camera.setRotationFromQuaternion(
          yawObject.current.quaternion.multiply(pitchObject.current.quaternion)
        );
        camera.rotation.z = 0; // No roll
      }
    };

    // Event listeners
    canvas.domElement.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      canvas.domElement.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [camera, canvas]);

  // WASD movement
  useEffect(() => {
    const moveCamera = () => {
      velocity.current.set(0, 0, 0);

      direction.current.set(
        Number(keys.current.d) - Number(keys.current.a),
        Number(keys.current.space) - Number(keys.current.shift),
        Number(keys.current.w) - Number(keys.current.s)
      );

      direction.current.normalize();
      direction.current.applyQuaternion(yawObject.current.quaternion);
      direction.current.applyQuaternion(pitchObject.current.quaternion);

      velocity.current.copy(direction.current.multiplyScalar(0.05));
      camera.position.add(velocity.current);
    };

    const interval = setInterval(moveCamera, 16);
    return () => clearInterval(interval);
  }, [camera]);

  return null;
};
