import React from "react";

interface Props {
  title: string;
  children: React.ReactNode;
}

export const Section: React.FC<Props> = ({ title, children }) => (
  <div style={sectionStyle}>
    <div style={titleStyle}>{title}</div>
    {children}
  </div>
);

const sectionStyle: React.CSSProperties = {
  marginBottom: 14,
};

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
  marginBottom: 8,
};
