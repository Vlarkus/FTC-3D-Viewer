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
  <div className="range-row">
    <div className="range-row-label">{label}</div>
    <div className="range-row-inputs">
      <input
        value={min}
        onChange={(e) => setMin(e.target.value)}
        placeholder="min"
        className="range-row-input"
      />
      <input
        value={max}
        onChange={(e) => setMax(e.target.value)}
        placeholder="max"
        className="range-row-input"
      />
    </div>
  </div>
);
