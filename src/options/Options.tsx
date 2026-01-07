// src/options/Options.tsx
import React from "react";
import { Section } from "./Section";
import { RangeRow } from "./RangeRow";
import { LabeledInput } from "./LabeledInput";
import { useGraph } from "../context/GraphContext";

export const Options: React.FC = () => {
  const {
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
    showFaceGrid,
    setShowFaceGrid,
    addRandomPoint,
    resetPoints,
    // NEW: camera controls
    cameraMode,
    setCameraMode,
  } = useGraph();

  return (
    <div className="options-container">
      <h2 className="options-title">Plot Box Settings</h2>

      <Section title="Ranges">
        <RangeRow
          label="X"
          min={xMin}
          max={xMax}
          setMin={setXMin}
          setMax={setXMax}
        />
        <RangeRow
          label="Y"
          min={yMin}
          max={yMax}
          setMin={setYMin}
          setMax={setYMax}
        />
        <RangeRow
          label="Z"
          min={zMin}
          max={zMax}
          setMin={setZMin}
          setMax={setZMax}
        />
      </Section>

      <Section title="Grid (tick spacing)">
        <LabeledInput label="X step" value={xStep} onChange={setXStep} />
        <LabeledInput label="Y step" value={yStep} onChange={setYStep} />
        <LabeledInput label="Z step" value={zStep} onChange={setZStep} />

        <div className="options-checkbox-row">
          <label className="options-checkbox-label">
            <input
              type="checkbox"
              checked={showFaceGrid}
              onChange={(e) => setShowFaceGrid(e.target.checked)}
            />
            <span>Show face gridlines</span>
          </label>
        </div>
      </Section>

      {/* NEW: Camera Mode Section */}
      <Section title="Camera Mode">
        <div className="camera-mode-group">
          <label className="camera-mode-option">
            <input
              type="radio"
              name="cameraMode"
              checked={cameraMode === "free"}
              onChange={() => setCameraMode("free")}
            />
            <span>Free camera</span>
          </label>
          <label className="camera-mode-option">
            <input
              type="radio"
              name="cameraMode"
              checked={cameraMode === "follow"}
              onChange={() => setCameraMode("follow")}
            />
            <span>Follow center</span>
          </label>
        </div>
      </Section>

      <Section title="Test">
        <button className="options-button" onClick={addRandomPoint}>
          Add random point
        </button>
        <button
          className="options-button options-button-secondary"
          onClick={resetPoints}
        >
          Reset points
        </button>
      </Section>
    </div>
  );
};
