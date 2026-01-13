import { useRef, useState, type ChangeEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAppStore } from "../../store/useAppStore";
import { AlertModal } from "./AlertModal";

const BLITZ_FILE_EXTENSION = ".txt";

export const ImportGeometryPanel = () => {
  const addGroup = useAppStore((state) => state.addGroup);
  const addEntity = useAppStore((state) => state.addEntity);
  const axes = useAppStore((state) => state.axes);

  const importInputRef = useRef<HTMLInputElement>(null);
  const importEntitiesInputRef = useRef<HTMLInputElement>(null);
  const [alertModal, setAlertModal] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportEntitiesClick = () => {
    importEntitiesInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    let parsed: any;
    try {
      parsed = JSON.parse(await file.text());
    } catch (error) {
      setAlertModal({
        title: "Import Error",
        message: "Failed to parse Blitz file. Please select valid JSON.",
      });
      return;
    }

    if (!parsed?.trajectories || !Array.isArray(parsed.trajectories)) {
      setAlertModal({
        title: "Import Error",
        message: 'Invalid Blitz file. Expected a "trajectories" array.',
      });
      return;
    }

    const toPlotValue = (
      val: number,
      range: { min: number; max: number; size: number }
    ) => {
      const size = range.size === 0 ? 1 : range.size;
      const pct = val / size + 0.5;
      return range.min + pct * (range.max - range.min);
    };

    const toPlotPoint = (x: number, y: number, z: number) => {
      return [
        toPlotValue(x, axes.x),
        toPlotValue(y, axes.z),
        toPlotValue(z, axes.y),
      ] as [number, number, number];
    };

    parsed.trajectories.forEach((trajectory: any, trajectoryIndex: number) => {
      const groupId = `group-${uuidv4()}`;
      const groupName = trajectory?._name || `Trajectory ${trajectoryIndex + 1}`;
      const groupVisible = trajectory?._isVisible ?? true;
      const importColor = trajectory?._color || "#00D084";

      const getControlPointPosition = (controlPoint: any) => {
        const x = typeof controlPoint?._x === "number" ? controlPoint._x : 0;
        const y = typeof controlPoint?._y === "number" ? controlPoint._y : 0;
        return toPlotPoint(x, y, 0);
      };

      const getHandlePosition = (
        controlPoint: any,
        handleKey: "_handleIn" | "_handleOut"
      ) => {
        const baseX = typeof controlPoint?._x === "number" ? controlPoint._x : 0;
        const baseY = typeof controlPoint?._y === "number" ? controlPoint._y : 0;
        const handle = controlPoint?.[handleKey];
        const r = typeof handle?._r === "number" ? handle._r : 0;
        const theta = typeof handle?._theta === "number" ? handle._theta : 0;
        if (!handle) return toPlotPoint(baseX, baseY, 0);
        return toPlotPoint(
          baseX + r * Math.cos(theta),
          baseY + r * Math.sin(theta),
          0
        );
      };

      addGroup({
        id: groupId,
        name: groupName,
        parentId: undefined,
        visible: groupVisible,
      });

      const pointsGroupId = `group-${uuidv4()}`;
      addGroup({
        id: pointsGroupId,
        name: "Points",
        parentId: groupId,
        visible: groupVisible,
      });

      const segmentsGroupId = `group-${uuidv4()}`;
      addGroup({
        id: segmentsGroupId,
        name: "Segments",
        parentId: groupId,
        visible: groupVisible,
      });

      const controlPoints = Array.isArray(trajectory?._controlPoints)
        ? trajectory._controlPoints
        : [];
      controlPoints.forEach((controlPoint: any, pointIndex: number) => {
        const pointName = controlPoint?._name || `Control Point ${pointIndex + 1}`;
        const position = getControlPointPosition(controlPoint);

        addEntity({
          id: `entity-${uuidv4()}`,
          parentId: pointsGroupId,
          name: pointName,
          type: "point",
          visible: true,
          color: importColor,
          opacity: 1,
          coordinateSpace: "plot",
          visibleIfOutsideGraph: true,
          data: {
            position,
            radius: 0.05,
            shape: "sphere",
          },
        });
      });

      for (let i = 0; i < controlPoints.length - 1; i += 1) {
        const startPoint = controlPoints[i];
        const endPoint = controlPoints[i + 1];
        const start = getControlPointPosition(startPoint);
        const end = getControlPointPosition(endPoint);
        const control1 = getHandlePosition(startPoint, "_handleOut");
        const control2 = getHandlePosition(endPoint, "_handleIn");

        addEntity({
          id: `entity-${uuidv4()}`,
          parentId: segmentsGroupId,
          name: `${groupName} Bezier ${i + 1}`,
          type: "cubic-bezier",
          visible: true,
          color: importColor,
          opacity: 1,
          coordinateSpace: "plot",
          visibleIfOutsideGraph: true,
          data: {
            start,
            control1,
            control2,
            end,
            thickness: 2,
            style: "solid",
          },
        });
      }
    });
  };

  const handleImportEntitiesFile = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    let parsed: any;
    try {
      parsed = JSON.parse(await file.text());
    } catch (error) {
      setAlertModal({
        title: "Import Error",
        message: "Failed to parse entity file. Please select valid JSON.",
      });
      return;
    }

    if (!parsed?.items || !Array.isArray(parsed.items)) {
      setAlertModal({
        title: "Import Error",
        message: 'Invalid entity file. Expected an "items" array.',
      });
      return;
    }

    const importItem = (item: any, parentId?: string) => {
      if (item?.type === "group") {
        const groupId = `group-${uuidv4()}`;
        addGroup({
          id: groupId,
          name: item.name || "Imported Group",
          parentId,
          visible: item.visible ?? true,
        });
        const children = Array.isArray(item.children) ? item.children : [];
        children.forEach((child: any) => importItem(child, groupId));
      } else if (item?.type === "entity") {
        const entity = item.entity;
        if (!entity || !entity.type) return;
        addEntity({
          id: `entity-${uuidv4()}`,
          parentId,
          name: entity.name || "Imported Entity",
          type: entity.type,
          visible: entity.visible ?? true,
          color: entity.color || "#ffffff",
          opacity: entity.opacity ?? 1,
          coordinateSpace: entity.coordinateSpace || "plot",
          visibleIfOutsideGraph: entity.visibleIfOutsideGraph ?? true,
          data: entity.data ?? {},
        });
      }
    };

    parsed.items.forEach((item: any) => importItem(item));
  };

  return (
    <div className="space-y-2">
      <AlertModal
        isOpen={!!alertModal}
        onClose={() => setAlertModal(null)}
        title={alertModal?.title ?? ""}
        message={alertModal?.message ?? ""}
      />
      <button
        onClick={handleImportClick}
        className="w-full py-2 rounded text-[10px] font-bold uppercase border bg-surface text-muted-foreground border-border hover:text-white transition-colors"
      >
        Import from Blitz
      </button>
      <input
        ref={importInputRef}
        type="file"
        accept={BLITZ_FILE_EXTENSION}
        className="hidden"
        onChange={handleImportFile}
      />
      <button
        onClick={handleImportEntitiesClick}
        className="w-full py-2 rounded text-[10px] font-bold uppercase border bg-surface text-muted-foreground border-border hover:text-white transition-colors"
      >
        Import Entities
      </button>
      <input
        ref={importEntitiesInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportEntitiesFile}
      />
    </div>
  );
};
