import React from "react";
import { CanvasProvider } from "./canvas/CanvasProvider";
import { Options } from "./options/Options";
import "./styles/globals.css";

const App: React.FC = () => (
  <div style={containerStyle}>
    <aside style={sidePanelStyle}>
      <Options />
    </aside>

    <main style={canvasStyle}>
      <CanvasProvider />
    </main>
  </div>
);

const containerStyle: React.CSSProperties = {
  display: "flex",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
};

const sidePanelStyle: React.CSSProperties = {
  flex: "0 0 320px",
  background: "#fafafa",
  borderRight: "1px solid #ddd",
  overflowY: "auto",
};

const canvasStyle: React.CSSProperties = {
  flex: 1,
  background: "#111",
};

export default App;
