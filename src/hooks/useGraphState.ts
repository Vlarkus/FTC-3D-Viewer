// src/hooks/useGraphState.ts
import { useState, useCallback } from "react";
import type { Point3 } from "../canvas/Points";

type Range = { min: number; max: number };

export const useGraphState = () => {
  // ----- ranges – keep the raw strings for the inputs -----
  const [xMin, setXMin] = useState("-5");
  const [xMax, setXMax] = useState("5");
  const [yMin, setYMin] = useState("-5");
  const [yMax, setYMax] = useState("5");
  const [zMin, setZMin] = useState("-5");
  const [zMax, setZMax] = useState("5");

  // ----- step sizes (grid spacing) – also strings -----
  const [xStep, setXStep] = useState("1");
  const [yStep, setYStep] = useState("1");
  const [zStep, setZStep] = useState("1");

  // ----- face‑grid toggle ---------------------------------
  const [showFaceGrid, setShowFaceGrid] = useState(true);

  // ----- points -------------------------------------------
  const [points, setPoints] = useState<Point3[]>([{ x: 0, y: 0, z: 0 }]);

  // ----- helpers ------------------------------------------
  const addRandomPoint = useCallback(() => {
    setPoints((p) => [
      ...p,
      {
        x: Math.random() * 4 - 2,
        y: Math.random() * 4 - 2,
        z: Math.random() * 4 - 2,
      },
    ]);
  }, []);

  const resetPoints = useCallback(() => setPoints([{ x: 0, y: 0, z: 0 }]), []);

  // ----- derived numeric values for the canvas -------------
  const xRange: Range = { min: Number(xMin), max: Number(xMax) };
  const yRange: Range = { min: Number(yMin), max: Number(yMax) };
  const zRange: Range = { min: Number(zMin), max: Number(zMax) };

  const xs = Number(xStep);
  const ys = Number(yStep);
  const zs = Number(zStep);

  const xStepNum = Number.isFinite(xs) && xs > 0 ? xs : 1;
  const yStepNum = Number.isFinite(ys) && ys > 0 ? ys : 1;
  const zStepNum = Number.isFinite(zs) && zs > 0 ? zs : 1;

  // src/hooks/useGraphState.ts
  // ... (same as previously posted) ...
  return {
    // raw strings
    xMin,
    xMax,
    yMin,
    yMax,
    zMin,
    zMax,
    setXMin,
    setXMax,
    setYMin,
    setYMax,
    setZMin,
    setZMax,
    xStep,
    yStep,
    zStep,
    setXStep,
    setYStep,
    setZStep,

    // derived numeric values for the canvas
    xRange,
    yRange,
    zRange,
    xStepNum,
    yStepNum,
    zStepNum,
    showFaceGrid,
    setShowFaceGrid,
    points,
    addRandomPoint,
    resetPoints,
  };
};
