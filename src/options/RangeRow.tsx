import React from "react";

interface Props {
  label: string;
  min: string;
  max: string;
  setMin: (v: string) => void;
  setMax: (v: string) => void;
}

export const RangeRow: React.FC<Props> = ({
  label,
  min,
  max,
  setMin,
  setMax,
}) => (
  <div style={rowStyle}>
    <div style={{ fontWeight: 600 }}>{label}</div>
    <div style={inputsContainer}>
      <input
        value={min}
        onChange={(e) => setMin(e.target.value)}
        placeholder="min"
        style={inputStyle}
      />
      <input
        value={max}
        onChange={(e) => setMax(e.target.value)}
        placeholder="max"
        style={inputStyle}
      />
    </div>
  </div>
);

const rowStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  marginBottom: 10,
};

const inputsContainer: React.CSSProperties = {
  display: "flex",
  gap: 8,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: 8,
  border: "1px solid #ccc",
  borderRadius: 6,
};
