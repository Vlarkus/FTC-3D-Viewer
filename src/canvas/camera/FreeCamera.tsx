// src/canvas/FreeCamera.tsx
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
    s: false,
    a: false,
    d: false,
    space: false,
    shift: false,
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
  });
  const yawObject = useRef<THREE.Object3D>(new THREE.Object3D());
  const pitchObject = useRef<THREE.Object3D>(new THREE.Object3D());

  // Input handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, keyof typeof keys.current> = {
        KeyW: "w",
        KeyS: "s",
        KeyA: "a",
        KeyD: "d",
        Space: "space",
        ShiftLeft: "shift",
        ShiftRight: "shift",
        ArrowLeft: "ArrowLeft",
        ArrowRight: "ArrowRight",
        ArrowUp: "ArrowUp",
        ArrowDown: "ArrowDown",
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
        KeyS: "s",
        KeyA: "a",
        KeyD: "d",
        Space: "space",
        ShiftLeft: "shift",
        ShiftRight: "shift",
        ArrowLeft: "ArrowLeft",
        ArrowRight: "ArrowRight",
        ArrowUp: "ArrowUp",
        ArrowDown: "ArrowDown",
      };
      const key = keyMap[e.code];
      if (key) {
        keys.current[key] = false;
        e.preventDefault();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 0) {
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
        yawObject.current.rotation.y -= e.movementX * 0.002;
        pitchObject.current.rotation.x -= e.movementY * 0.002;
        pitchObject.current.rotation.x = Math.max(
          -Math.PI / 2 + 0.01,
          Math.min(Math.PI / 2 - 0.01, pitchObject.current.rotation.x)
        );
      }
    };

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
  }, [canvas]);

  // Single RAF loop with ARROW KEY ROTATION
  useEffect(() => {
    let rafId: number;

    const updateCamera = () => {
      // Screen-perpendicular axes
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(camera.quaternion).normalize();

      const screenRight = new THREE.Vector3(0, 1, 0).cross(forward).normalize();
      const screenUp = new THREE.Vector3(0, 0, -1)
        .cross(screenRight)
        .normalize();

      // Arrow keys rotate around screen axes
      if (keys.current.ArrowLeft) camera.rotateOnAxis(screenRight, 0.03);
      if (keys.current.ArrowRight) camera.rotateOnAxis(screenRight, -0.03);
      if (keys.current.ArrowUp) camera.rotateOnAxis(screenUp, 0.03);
      if (keys.current.ArrowDown) camera.rotateOnAxis(screenUp, -0.03);

      // *** FIXED TYPE-SAFE PITCH LOCK ***
      const euler = new THREE.Euler();
      const worldQuat = new THREE.Quaternion();
      camera.getWorldQuaternion(worldQuat);
      euler.setFromQuaternion(worldQuat);
      euler.x = Math.max(
        -Math.PI / 2 + 0.01,
        Math.min(Math.PI / 2 - 0.01, euler.x)
      );
      euler.z = 0;
      camera.setRotationFromEuler(euler);

      // WASD movement
      velocity.current.set(0, 0, 0);
      direction.current.set(
        Number(keys.current.d) - Number(keys.current.a),
        Number(keys.current.space) - Number(keys.current.shift),
        Number(keys.current.w) - Number(keys.current.s)
      );

      if (direction.current.length() > 0) {
        direction.current.normalize();
        direction.current.applyQuaternion(camera.quaternion);
        velocity.current.copy(direction.current.multiplyScalar(0.05));
        camera.position.add(velocity.current);
      }

      rafId = requestAnimationFrame(updateCamera);
    };

    updateCamera();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [camera]);

  return null;
};
