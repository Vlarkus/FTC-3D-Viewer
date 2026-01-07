import React, { useMemo, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGraph } from "../../context/GraphContext";

export const FollowCamera: React.FC = () => {
  const { camera } = useThree();
  const { xRange, yRange, zRange } = useGraph();

  const center = useMemo(
    () =>
      new THREE.Vector3(
        (xRange.min + xRange.max) / 2,
        (yRange.min + yRange.max) / 2,
        (zRange.min + zRange.max) / 2
      ),
    [xRange, yRange, zRange]
  );

  // Position camera around graph center + OrbitControls
  useEffect(() => {
    camera.position.set(center.x + 8, center.y + 8, center.z + 10);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }, [camera, center]);

  return <OrbitControls makeDefault />;
};
