import React from "react";
import { telemetryStore } from "../../store/telemetryStore";
import { useAppStore } from "../../store/useAppStore";

const formatCoords = (coords: [number, number, number], decimals = 2) =>
  `(${coords
    .map((val) => (Number.isFinite(val) ? val.toFixed(decimals) : "0.00"))
    .join(", ")})`;

const coerceNumber = (value: any) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const HudOverlay = () => {
  const { telemetryMapping, robotSettings, hoveredPoint } = useAppStore();
  const telemetrySnapshot = React.useSyncExternalStore(
    telemetryStore.subscribe,
    telemetryStore.getState
  ) as Record<string, any>;

  const robotCoords =
    robotSettings.showRobot && robotSettings.showCoordinates
      ? ([
          coerceNumber(
            telemetryMapping.x ? telemetrySnapshot[telemetryMapping.x] : 0
          ),
          coerceNumber(
            telemetryMapping.y ? telemetrySnapshot[telemetryMapping.y] : 0
          ),
          coerceNumber(
            telemetryMapping.z ? telemetrySnapshot[telemetryMapping.z] : 0
          ),
        ] as [number, number, number])
      : null;

  if (!hoveredPoint && !robotCoords) return null;

  return (
    <div className="pointer-events-none absolute top-3 right-3 z-10 flex flex-col gap-2 text-[10px]">
      {robotCoords && (
        <div className="rounded bg-black/80 border border-white/20 px-2 py-1 text-white font-mono shadow-xl">
          <div className="text-[9px] uppercase text-muted-foreground">
            Robot
          </div>
          <div>{formatCoords(robotCoords, 1)}</div>
        </div>
      )}
      {hoveredPoint && (
        <div className="rounded bg-black/80 border border-white/20 px-2 py-1 text-white font-mono shadow-xl">
          <div className="text-[9px] uppercase text-muted-foreground">
            {hoveredPoint.name || "Point"}
          </div>
          <div>{formatCoords(hoveredPoint.coords)}</div>
        </div>
      )}
    </div>
  );
};
