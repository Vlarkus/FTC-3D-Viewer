import React from "react";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export const LabeledInput: React.FC<Props> = ({ label, value, onChange }) => (
  <div style={containerStyle}>
    <div style={labelStyle}>{label}</div>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  </div>
);

const containerStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  marginBottom: 10,
};

const labelStyle: React.CSSProperties = {
  color: "#ffffffff",
};

const inputStyle: React.CSSProperties = {
  padding: 8,
  border: "1px solid #ffffffff",
  borderRadius: 6,
};
