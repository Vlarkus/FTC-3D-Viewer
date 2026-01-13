import { useSyncExternalStore, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAppStore } from "../../store/useAppStore";
import { trailStore, type TrailPoint } from "../../store/trailStore";
import clsx from "clsx";
import { NumberField } from "./NumberField";
import { AlertModal } from "./AlertModal";

const useHasTrailPoints = () =>
  useSyncExternalStore(
    trailStore.subscribe,
    () => trailStore.getState().some((marker) => !("break" in marker)),
    () => false
  );

export const TrailPanel = () => {
  const trailSettings = useAppStore((state) => state.trailSettings);
  const setTrailSettings = useAppStore((state) => state.setTrailSettings);
  const clearTrail = useAppStore((state) => state.clearTrail);
  const addGroup = useAppStore((state) => state.addGroup);
  const addEntity = useAppStore((state) => state.addEntity);
  const hasTrailPoints = useHasTrailPoints();
  const [alertModal, setAlertModal] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const recordTrailToEntities = () => {
    const trail = trailStore.getState();
    const hasPoints = trail.some((marker) => !("break" in marker));
    if (!hasPoints) {
      setAlertModal({
        title: "Record Trail",
        message: "No trail points to record.",
      });
      return;
    }

    const groupId = `group-${uuidv4()}`;
    addGroup({
      id: groupId,
      name: "Recorded Trail",
      parentId: undefined,
      visible: true,
    });

    const pointsGroupId = `group-${uuidv4()}`;
    addGroup({
      id: pointsGroupId,
      name: "Points",
      parentId: groupId,
      visible: true,
    });

    const segmentsGroupId = `group-${uuidv4()}`;
    addGroup({
      id: segmentsGroupId,
      name: "Segments",
      parentId: groupId,
      visible: true,
    });

    let lastPoint: TrailPoint | null = null;
    let pointIndex = 0;
    let segmentIndex = 0;

    trail.forEach((marker) => {
      if ("break" in marker) {
        lastPoint = null;
        return;
      }

      pointIndex += 1;
      addEntity({
        id: `entity-${uuidv4()}`,
        parentId: pointsGroupId,
        name: `Trail Point ${pointIndex}`,
        type: "point",
        visible: true,
        color: trailSettings.color,
        opacity: 1,
        coordinateSpace: "plot",
        visibleIfOutsideGraph: true,
        data: {
          position: [marker.x, marker.y, marker.z],
          radius: 0.05,
          shape: "sphere",
        },
      });

      if (lastPoint) {
        segmentIndex += 1;
        addEntity({
          id: `entity-${uuidv4()}`,
          parentId: segmentsGroupId,
          name: `Trail Segment ${segmentIndex}`,
          type: "line",
          visible: true,
          color: trailSettings.color,
          opacity: 1,
          coordinateSpace: "plot",
          visibleIfOutsideGraph: true,
          data: {
            start: [lastPoint.x, lastPoint.y, lastPoint.z],
            end: [marker.x, marker.y, marker.z],
            thickness: 2,
            style: "solid",
          },
        });
      }

      lastPoint = marker;
    });
  };

  return (
    <div className="space-y-3">
      <AlertModal
        isOpen={!!alertModal}
        onClose={() => setAlertModal(null)}
        title={alertModal?.title ?? ""}
        message={alertModal?.message ?? ""}
      />
      <div className="space-y-3 bg-background/30 p-3 rounded border border-border/50">
        <div className="grid grid-cols-3 gap-2">
          {(["none", "points", "segments"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTrailSettings({ display: mode })}
              className={clsx(
                "py-2 rounded text-[10px] font-bold uppercase border transition-colors",
                trailSettings.display === mode
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-surface text-muted-foreground border-border hover:text-white"
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        <input
          type="color"
          value={trailSettings.color}
          onChange={(e) => setTrailSettings({ color: e.target.value })}
          className="block h-8 w-full cursor-pointer rounded border border-border bg-surface p-0 leading-none"
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTrailSettings({ mode: "controllable" })}
            className={clsx(
              "py-2 rounded text-[10px] font-bold uppercase border transition-colors",
              trailSettings.mode === "controllable"
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-surface text-muted-foreground border-border hover:text-white"
            )}
          >
            Controllable
          </button>
          <button
            onClick={() => setTrailSettings({ mode: "temporary" })}
            className={clsx(
              "py-2 rounded text-[10px] font-bold uppercase border transition-colors",
              trailSettings.mode === "temporary"
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-surface text-muted-foreground border-border hover:text-white"
            )}
          >
            Temporary
          </button>
        </div>

        {trailSettings.mode === "temporary" && (
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              value={trailSettings.tempLength}
              min={1}
              step={1}
              onChange={(val) =>
                setTrailSettings({ tempLength: Math.max(1, val) })
              }
              className="w-full"
            />
            <select
              value={trailSettings.tempUnit}
              onChange={(e) =>
                setTrailSettings({
                  tempUnit: e.target.value as typeof trailSettings.tempUnit,
                })
              }
              className="w-full bg-surface border border-border text-xs rounded px-2 py-1 outline-none focus:border-accent"
            >
              <option value="updates">Updates</option>
              <option value="seconds">Seconds</option>
            </select>
          </div>
        )}
      </div>

      {trailSettings.mode === "controllable" && (
        <div className="space-y-2 bg-background/30 p-3 rounded border border-border/50">
          {trailSettings.controllablePaused ? (
            hasTrailPoints ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    setTrailSettings({
                      controllablePaused: false,
                      breakNextSegment: trailSettings.display === "segments",
                    })
                  }
                  className="py-2 rounded text-[10px] font-bold uppercase border bg-accent text-accent-foreground border-accent hover:brightness-110 transition-colors"
                >
                  Continue (Jump)
                </button>
                <button
                  onClick={() =>
                    setTrailSettings({
                      controllablePaused: false,
                      breakNextSegment: false,
                    })
                  }
                  className="py-2 rounded text-[10px] font-bold uppercase border bg-surface text-muted-foreground border-border hover:text-white transition-colors"
                >
                  Continue (No Jump)
                </button>
              </div>
            ) : (
              <button
                onClick={() =>
                  setTrailSettings({
                    controllablePaused: false,
                    breakNextSegment: false,
                  })
                }
                className="w-full py-2 rounded text-[10px] font-bold uppercase border bg-accent text-accent-foreground border-accent hover:brightness-110 transition-colors"
              >
                Start
              </button>
            )
          ) : (
            <button
              onClick={() => setTrailSettings({ controllablePaused: true })}
              className="w-full py-2 rounded text-[10px] font-bold uppercase border bg-surface text-muted-foreground border-border hover:text-white transition-colors"
            >
              Stop
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={recordTrailToEntities}
              className="py-2 rounded text-[10px] font-bold uppercase border bg-surface text-muted-foreground border-border hover:text-white transition-colors"
            >
              Record
            </button>
            <button
              onClick={clearTrail}
              className="py-2 rounded text-[10px] font-bold uppercase border border-destructive bg-destructive text-destructive-foreground hover:brightness-110 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
