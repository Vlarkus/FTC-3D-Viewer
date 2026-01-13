import React from "react";
import { useAppStore } from "../../store/useAppStore";
import { MousePointer2, Orbit } from "lucide-react";
import { NumberField } from "./NumberField";

export const CameraPanel: React.FC = () => {
  const {
    cameraMode,
    setCameraMode,
    orbitTarget,
    setOrbitTarget,
    cameraSpeed,
    setCameraSpeed,
  } = useAppStore();
  const [isTouch, setIsTouch] = React.useState(false);
  const [warning, setWarning] = React.useState("");

  React.useEffect(() => {
    // Simple touch detection
    const checkTouch = () => {
      // Coarse pointer usually means touch
      if (window.matchMedia("(pointer: coarse)").matches) {
        setIsTouch(true);
        if (cameraMode === "free") {
          setCameraMode("orbit"); // Enforce orbit if somehow in free
          setWarning("Free camera disabled on touch devices");
          setTimeout(() => setWarning(""), 3000);
        }
      }
    };
    checkTouch();
  }, [cameraMode]); // Re-check if mode changes, ensuring enforcement

  const handleFreeModeClick = () => {
    if (isTouch) {
      setWarning("Free camera requires mouse/keyboard");
      setTimeout(() => setWarning(""), 3000);
      return;
    }
    setCameraMode("free");
  };

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="flex bg-background border border-border rounded p-1">
        <button
          onClick={() => setCameraMode("orbit")}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs rounded transition-colors ${
            cameraMode === "orbit"
              ? "bg-surface-highlight text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Orbit size={14} /> Orbit
        </button>
        <button
          onClick={handleFreeModeClick}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs rounded transition-colors ${
            cameraMode === "free"
              ? "bg-surface-highlight text-white"
              : isTouch
              ? "text-muted-foreground/50 cursor-not-allowed"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MousePointer2 size={14} /> Free
        </button>
      </div>

      {/* Warning Message */}
      {warning && (
        <div className="text-[10px] text-yellow-500 font-bold bg-yellow-500/10 p-2 rounded text-center">
          {warning}
        </div>
      )}

      {/* Orbit Options */}
      {cameraMode === "orbit" && (
        <div className="space-y-2">
          <div className="flex bg-background border border-border rounded p-1">
            <button
              onClick={() => setOrbitTarget("origin")}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs rounded transition-colors ${
                orbitTarget === "origin"
                  ? "bg-surface-highlight text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Origin
            </button>
            <button
              onClick={() => setOrbitTarget("robot")}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs rounded transition-colors ${
                orbitTarget === "robot"
                  ? "bg-surface-highlight text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Robot
            </button>
          </div>
        </div>
      )}

      {cameraMode === "free" && (
        <div className="space-y-2">
          <div>
            <span className="block text-[10px] text-muted-foreground mb-1">
              Move Speed
            </span>
            <NumberField
              value={cameraSpeed}
              onChange={(val) => setCameraSpeed(val)}
              step={0.5}
            />
          </div>
          <div className="text-xs text-muted-foreground bg-surface-highlight p-2 rounded">
            WASD to move
            <br />
            Shift/Space for down/up
            <br />
            Scroll to change speed
            <br />
            Use mouse to look around
          </div>
        </div>
      )}
    </div>
  );
};
