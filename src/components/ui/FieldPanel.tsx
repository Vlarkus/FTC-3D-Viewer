import React from "react";
import { useAppStore } from "../../store/useAppStore";
import { NumberField } from "./NumberField";

export const FieldPanel: React.FC = () => {
  const {
    showFieldModel,
    setShowFieldModel,
    fieldSizeMode,
    setFieldSizeMode,
    fieldSizeValue,
    setFieldSizeValue,
    fieldPositionMode,
    setFieldPositionMode,
    fieldPosition,
    setFieldPosition,
  } = useAppStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showFieldModel}
          onChange={(e) => setShowFieldModel(e.target.checked)}
        />
        <span className="text-sm font-semibold">Enable Field Model</span>
      </div>

      {showFieldModel && (
        <div className="space-y-2">
          <div className="flex bg-background border border-border rounded p-1">
            <button
              onClick={() => setFieldSizeMode("world")}
              className={`flex-1 flex items-center justify-center py-1.5 text-xs rounded transition-colors ${
                fieldSizeMode === "world"
                  ? "bg-surface-highlight text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              World
            </button>
            <button
              onClick={() => setFieldSizeMode("grid")}
              className={`flex-1 flex items-center justify-center py-1.5 text-xs rounded transition-colors ${
                fieldSizeMode === "grid"
                  ? "bg-surface-highlight text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Grid
            </button>
          </div>
          <div className="flex bg-background border border-border rounded p-1">
            <button
              onClick={() => setFieldPositionMode("grid-bottom")}
              className={`flex-1 flex items-center justify-center py-1.5 text-xs rounded transition-colors ${
                fieldPositionMode === "grid-bottom"
                  ? "bg-surface-highlight text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bottom
            </button>
            <button
              onClick={() => setFieldPositionMode("custom")}
              className={`flex-1 flex items-center justify-center py-1.5 text-xs rounded transition-colors ${
                fieldPositionMode === "custom"
                  ? "bg-surface-highlight text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Custom
            </button>
          </div>
          <div>
            <span className="block text-[10px] text-muted-foreground mb-1">
              Field Size ({fieldSizeMode})
            </span>
            <NumberField
              value={fieldSizeValue}
              min={0.01}
              step={0.1}
              onChange={(val) => setFieldSizeValue(val)}
            />
          </div>
          {fieldPositionMode === "custom" && (
            <div className="space-y-2">
              <span className="block text-[10px] text-muted-foreground">
                Field Position ({fieldSizeMode})
              </span>
              <div className="grid grid-cols-3 gap-2">
                <NumberField
                  value={fieldPosition.x}
                  step={0.1}
                  onChange={(val) =>
                    setFieldPosition({ ...fieldPosition, x: val })
                  }
                />
                <NumberField
                  value={fieldPosition.y}
                  step={0.1}
                  onChange={(val) =>
                    setFieldPosition({ ...fieldPosition, y: val })
                  }
                />
                <NumberField
                  value={fieldPosition.z}
                  step={0.1}
                  onChange={(val) =>
                    setFieldPosition({ ...fieldPosition, z: val })
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
