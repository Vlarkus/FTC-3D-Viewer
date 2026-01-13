import React from "react";
import { useAppStore } from "../../store/useAppStore";
import { Eye, Hash, Maximize2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NumberField } from "./NumberField";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const RobotSettingsPanel: React.FC = () => {
  const { robotSettings, setRobotSettings } = useAppStore();
  const visualsDisabled = !robotSettings.showRobot;

  const Toggle = ({
    label,
    value,
    onChange,
    icon: Icon,
    disabled = false,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
    icon: any;
    disabled?: boolean;
  }) => (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between p-2 rounded border transition-all text-xs",
        disabled
          ? "bg-surface/20 border-border/30 text-muted-foreground/40 cursor-not-allowed"
          : value
          ? "bg-accent/10 border-accent/50 text-accent-foreground"
          : "bg-surface/30 border-border/50 text-muted-foreground hover:border-border"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          size={14}
          className={value ? "text-accent" : "text-muted-foreground"}
        />
        <span>{label}</span>
      </div>
      <div
        className={cn(
          "w-8 h-4 rounded-full relative transition-colors",
          disabled ? "bg-muted/20" : value ? "bg-accent" : "bg-muted/30"
        )}
      >
        <div
          className={cn(
            "absolute top-1 w-2 h-2 rounded-full bg-white transition-all",
            value ? "left-5" : "left-1"
          )}
        />
      </div>
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="space-y-3 bg-background/30 p-3 rounded border border-border/50">
        <Toggle
          label="Show Robot Dot"
          value={robotSettings.showRobot}
          onChange={(v) => setRobotSettings({ showRobot: v })}
          icon={Eye}
        />
        <Toggle
          label="Show Coordinates"
          value={robotSettings.showCoordinates}
          onChange={(v) => setRobotSettings({ showCoordinates: v })}
          icon={Hash}
          disabled={visualsDisabled}
        />
        <Toggle
          label="Projection Lines"
          value={robotSettings.showProjections}
          onChange={(v) => setRobotSettings({ showProjections: v })}
          icon={Maximize2}
          disabled={visualsDisabled}
        />

        <div
          className={cn(
            "space-y-2",
            visualsDisabled && "opacity-40 pointer-events-none"
          )}
        >
          <div className="text-[10px] font-bold text-muted-foreground uppercase">
            Robot Point
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              value={robotSettings.robotSize}
              min={0.05}
              max={2}
              step={0.01}
              onChange={(val) => setRobotSettings({ robotSize: val })}
              className="w-full"
            />
            <input
              type="color"
              value={robotSettings.robotColor}
              onChange={(e) => setRobotSettings({ robotColor: e.target.value })}
              className="h-8 w-full cursor-pointer rounded border border-border bg-surface p-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
