import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useAppStore } from "../../store/useAppStore";

const FIELD_MODEL_PATH = "/Field/decode-field.gltf";

// Scale multipliers applied after the size mode is computed.
const FIELD_MODEL_SCALE = { x: 1, y: 1, z: 1 };
const FIELD_MODEL_POSITION: [number, number, number] = [0, 0, 0];
const FIELD_MODEL_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0]; // Radians

export const FieldModel = () => {
  const { scene } = useGLTF(FIELD_MODEL_PATH);
  const {
    axes,
    fieldSizeMode,
    fieldSizeValue,
    fieldPositionMode,
    fieldPosition,
  } = useAppStore();

  const baseSize = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    return size;
  }, [scene]);

  const scale = useMemo<[number, number, number]>(() => {
    const modelReferenceSize = Math.max(baseSize.x, baseSize.z, 1);
    const gridReferenceSize = Math.max(axes.x.size, axes.z.size, 1);
    const sizeFactor =
      fieldSizeMode === "grid"
        ? (gridReferenceSize * fieldSizeValue) / modelReferenceSize
        : fieldSizeValue;

    return [
      FIELD_MODEL_SCALE.x * sizeFactor,
      FIELD_MODEL_SCALE.y * sizeFactor,
      FIELD_MODEL_SCALE.z * sizeFactor,
    ];
  }, [axes.x.size, axes.z.size, baseSize, fieldSizeMode, fieldSizeValue]);

  const position = useMemo<[number, number, number]>(() => {
    if (fieldPositionMode === "grid-bottom") {
      const gridBottom = -axes.y.size / 2;
      const scaledHeight = (baseSize.y || 1) * scale[1];
      return [
        FIELD_MODEL_POSITION[0],
        gridBottom + scaledHeight / 2,
        FIELD_MODEL_POSITION[2],
      ];
    }

    if (fieldSizeMode === "grid") {
      const map = (
        val: number,
        range: { min: number; max: number; size: number }
      ) => {
        const span = range.max - range.min;
        if (span === 0) return 0;
        const pct = (val - range.min) / span;
        return (pct - 0.5) * range.size;
      };

      return [
        map(fieldPosition.x, axes.x),
        map(fieldPosition.z, axes.y),
        map(fieldPosition.y, axes.z),
      ];
    }

    return [fieldPosition.x, fieldPosition.y, fieldPosition.z];
  }, [
    axes,
    baseSize.y,
    fieldPosition,
    fieldPositionMode,
    fieldSizeMode,
    scale,
  ]);

  return (
    <primitive
      object={scene}
      position={position}
      rotation={FIELD_MODEL_ROTATION}
      scale={scale}
    />
  );
};

useGLTF.preload(FIELD_MODEL_PATH);
