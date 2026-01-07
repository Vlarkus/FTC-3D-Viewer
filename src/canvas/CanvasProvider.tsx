// src/canvas/CanvasProvider.tsx
import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { PlotBox } from "./PlotBox";
import { Points } from "./Points";
import { useGraph } from "../context/GraphContext";

export const CanvasProvider: React.FC = () => {
  const {
    xRange,
    yRange,
    zRange,
    xStepNum,
    yStepNum,
    zStepNum,
    showFaceGrid,
    points,
  } = useGraph(); // <-- shared state

  return (
    <Canvas camera={{ position: [8, 8, 10], fov: 55, near: 0.01, far: 5000 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 12, 8]} intensity={0.9} />
      <OrbitControls makeDefault />

      <PlotBox
        xRange={xRange}
        yRange={yRange}
        zRange={zRange}
        xStep={xStepNum}
        yStep={yStepNum}
        zStep={zStepNum}
        showFaceGrid={showFaceGrid}
      />

      <Points points={points} />
    </Canvas>
  );
};
