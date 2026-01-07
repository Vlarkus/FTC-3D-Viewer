// src/options/Options.tsx
import React from "react";
import { Section } from "./Section";
import { RangeRow } from "./RangeRow";
import { LabeledInput } from "./LabeledInput";
import { useGraph } from "../context/GraphContext";

export const Options: React.FC = () => {
  const {
    // raw strings for the inputs
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
    // other controls
    showFaceGrid,
    setShowFaceGrid,
    addRandomPoint,
    resetPoints,
  } = useGraph(); // <-- shared state

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Plot Box Settings</h2>

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

        <div style={{ marginTop: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={showFaceGrid}
              onChange={(e) => setShowFaceGrid(e.target.checked)}
            />
            Show face gridlines
          </label>
        </div>
      </Section>

      <Section title="Test">
        <button onClick={addRandomPoint}>Add random point</button>
        <button style={{ marginLeft: 8 }} onClick={resetPoints}>
          Reset points
        </button>
      </Section>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  padding: 12,
  boxSizing: "border-box",
  fontFamily: "system-ui, sans-serif",
  fontSize: 14,
};

const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  marginBottom: 10,
};
