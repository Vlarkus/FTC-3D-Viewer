import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useAppStore, type GeometryEntity } from "../../store/useAppStore";
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Folder,
  Box,
  GripHorizontal,
  FileDigit,
  FolderPlus,
  Layers,
  Pencil,
  Palette,
  Trash2,
  AlertTriangle,
  X,
  GripVertical,
  Download,
} from "lucide-react";
import clsx from "clsx";
import type { DragEndEvent } from "@dnd-kit/core";
import { v4 as uuidv4 } from "uuid";

const BLITZ_FILE_EXTENSION = ".txt";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "point":
      return (
        <div className="p-1 rounded bg-blue-500/20 text-blue-400">
          <Box size={12} />
        </div>
      );
    case "line":
      return (
        <div className="p-1 rounded bg-green-500/20 text-green-400">
          <GripHorizontal size={12} />
        </div>
      );
    case "cubic-bezier":
      return (
        <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
          <GripHorizontal size={12} />
        </div>
      );
    case "plane":
      return (
        <div className="p-1 rounded bg-purple-500/20 text-purple-400">
          <FileDigit size={12} />
        </div>
      );
    default:
      return (
        <div className="p-1 rounded bg-gray-500/20 text-gray-400">
          <Box size={12} />
        </div>
      );
  }
};

const DeletionModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isGroup = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (recursive: boolean) => void;
  title: string;
  message: string;
  isGroup?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-lg shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface-highlight/30">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={18} />
            <h3 className="font-bold text-sm uppercase tracking-wider">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-4 bg-surface-highlight/10 flex flex-col gap-2">
          {isGroup ? (
            <>
              <button
                onClick={() => onConfirm(true)}
                className="w-full py-2 px-4 bg-red-500 hover:bg-red-400 text-white rounded font-bold text-xs transition-colors shadow-lg shadow-red-500/20"
              >
                DELETE GROUP & ALL CONTENTS
              </button>
              <button
                onClick={() => onConfirm(false)}
                className="w-full py-2 px-4 bg-surface-highlight hover:bg-surface-highlight2 text-white/90 rounded font-bold text-xs transition-colors border border-border"
              >
                DELETE GROUP ONLY (KEEP CHILDREN)
              </button>
            </>
          ) : (
            <button
              onClick={() => onConfirm(true)}
              className="w-full py-2 px-4 bg-red-500 hover:bg-red-400 text-white rounded font-bold text-xs transition-colors shadow-lg shadow-red-500/20"
            >
              CONFIRM DELETION
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2 px-4 hover:bg-surface-highlight text-muted-foreground hover:text-white rounded text-xs transition-colors font-medium"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};

const ExportModal = ({
  isOpen,
  onClose,
  onExport,
  defaultName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onExport: (scope: "all" | "selected", name: string) => void;
  defaultName: string;
}) => {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (isOpen) setName(defaultName);
  }, [defaultName, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-lg shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface-highlight/30">
          <h3 className="font-bold text-sm uppercase tracking-wider text-accent">
            Export Geometry
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              File Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="geometry-export"
              className="w-full bg-surface border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-accent"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Choose what to export.
          </p>
        </div>

        <div className="p-4 bg-surface-highlight/10 flex flex-col gap-2">
          <button
            onClick={() => onExport("all", name)}
            className="w-full py-2 px-4 bg-accent text-accent-foreground rounded font-bold text-xs transition-colors hover:brightness-110"
          >
            EXPORT ALL
          </button>
          <button
            onClick={() => onExport("selected", name)}
            className="w-full py-2 px-4 bg-surface-highlight hover:bg-surface-highlight2 text-white/90 rounded font-bold text-xs transition-colors border border-border"
          >
            EXPORT SELECTED
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 hover:bg-surface-highlight text-muted-foreground hover:text-white rounded text-xs transition-colors font-medium"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};

const GroupItem = ({
  groupId,
  depth = 0,
  selectedIds,
  onSelect,
  isParentSelected = false,
}: {
  groupId: string;
  depth?: number;
  selectedIds: Set<string>;
  onSelect: (id: string, event: React.MouseEvent) => void;
  isParentSelected?: boolean;
}) => {
  const group = useAppStore((state) => state.groups[groupId]);
  const isMobile = useIsMobile();

  const [expanded, setExpanded] = useState(true);
  const isExpandedChild = expanded;
  const isSelected = selectedIds.has(groupId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: groupId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!group) return null;

  return (
    <div ref={setNodeRef} style={style}>
      {/* Header */}
      <div
        onClick={(event) => onSelect(groupId, event)}
        className={clsx(
          "flex items-center gap-2 p-1.5 hover:bg-surface-highlight rounded cursor-pointer group text-sm select-none transition-all",
          !group.visible && "opacity-50",
          isSelected
            ? "bg-accent/20 border border-accent/30 shadow-inner text-white font-bold"
            : isParentSelected
            ? "text-white opacity-80 font-medium"
            : "text-muted-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {/* Drag Handle - Desktop Only */}
        {!isMobile && (
          <div
            {...attributes}
            {...listeners}
            className="px-1 text-muted-foreground/30 hover:text-white cursor-grab active:cursor-grabbing transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={14} />
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="p-0.5 hover:text-white text-muted-foreground"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="text-yellow-500/80">
          <Folder size={14} />
        </div>

        <span className="flex-1 truncate font-medium">{group.name}</span>
      </div>

      {/* Children */}
      {isExpandedChild && (
        <SortableContext
          items={[...group.childrenGroups, ...group.childrenEntities]}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0.5">
            {group.childrenGroups.map((childId) => (
              <GroupItem
                key={childId}
                groupId={childId}
                depth={depth + 1}
                selectedIds={selectedIds}
                onSelect={onSelect}
                isParentSelected={isSelected || isParentSelected}
              />
            ))}
            {group.childrenEntities.map((childId) => (
              <EntityItem
                key={childId}
                entityId={childId}
                depth={depth + 1}
                selectedIds={selectedIds}
                onSelect={onSelect}
                isParentSelected={isSelected || isParentSelected}
              />
            ))}
          </div>
        </SortableContext>
      )}
      {isExpandedChild &&
        group.childrenGroups.length === 0 &&
        group.childrenEntities.length === 0 && (
          <div className="text-xs text-muted-foreground pl-8 py-1 italic opacity-50">
            Empty Group
          </div>
        )}
    </div>
  );
};

const EntityItem = ({
  entityId,
  depth,
  selectedIds,
  onSelect,
  isParentSelected = false,
}: {
  entityId: string;
  depth: number;
  selectedIds: Set<string>;
  onSelect: (id: string, event: React.MouseEvent) => void;
  isParentSelected?: boolean;
}) => {
  const entity = useAppStore((state) => state.entities[entityId]);
  const isMobile = useIsMobile();

  const isSelected = selectedIds.has(entityId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entityId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!entity) return null;

  return (
    <div
      ref={setNodeRef}
      onClick={(event) => onSelect(entityId, event)}
      className={clsx(
        "flex items-center gap-2 p-1.5 hover:bg-surface-highlight rounded cursor-pointer group text-xs select-none transition-all",
        !entity.visible && "opacity-50",
        isSelected
          ? "bg-accent/20 border border-accent/30 shadow-inner text-sm text-white font-bold"
          : isParentSelected
          ? "text-white opacity-80 font-medium"
          : "text-muted-foreground"
      )}
      style={{ ...style, paddingLeft: `${depth * 12 + 4}px` }}
    >
      {/* Drag Handle - Desktop Only */}
      {!isMobile && (
        <div
          {...attributes}
          {...listeners}
          className="px-1 text-muted-foreground/30 hover:text-white cursor-grab active:cursor-grabbing transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={12} />
        </div>
      )}
      <div className="w-4" /> {/* Spacer for chevron */}
      <TypeIcon type={entity.type} />
      <span className="flex-1 truncate">{entity.name}</span>
    </div>
  );
};

export const GeometryExplorer = () => {
  const rootGroupIds = useAppStore((state) => state.rootGroupIds);
  const rootEntityIds = useAppStore((state) => state.rootEntityIds);
  const entities = useAppStore((state) => state.entities);
  const groups = useAppStore((state) => state.groups);
  const createGroup = useAppStore((state) => state.createGroup);
  const addGroup = useAppStore((state) => state.addGroup);
  const addEntity = useAppStore((state) => state.addEntity);
  const updateGroup = useAppStore((state) => state.updateGroup);
  const updateEntity = useAppStore((state) => state.updateEntity);
  const removeGroup = useAppStore((state) => state.removeGroup);
  const removeEntity = useAppStore((state) => state.removeEntity);
  const reorderItem = useAppStore((state) => state.reorderItem);
  const trailSettings = useAppStore((state) => state.trailSettings);
  const setTrailSettings = useAppStore((state) => state.setTrailSettings);
  const clearTrail = useAppStore((state) => state.clearTrail);
  const changeParent = useAppStore((state) => state.changeParent);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletionTarget, setDeletionTarget] = useState<{
    ids: string[];
    name: string;
    isGroup: boolean;
    isMulti: boolean;
  } | null>(null);
  const [multiSelectEnabled, setMultiSelectEnabled] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const importEntitiesInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeId = active.id.toString();
      const overId = over.id.toString();

      // Determine if it's a group or entity
      const isGroup = !!groups[activeId];
      reorderItem(activeId, overId, isGroup);
    }
  };

  const handleCreateGroup = () => {
    const name = prompt("Group name:");
    if (name) createGroup(name);
  };

  const handleDeleteClick = () => {
    if (selectedIds.size === 0) return;

    if (selectedIds.size > 1) {
      setDeletionTarget({
        ids: Array.from(selectedIds),
        name: `${selectedIds.size} items`,
        isGroup: false,
        isMulti: true,
      });
      return;
    }

    const [onlyId] = Array.from(selectedIds);
    const group = groups[onlyId];
    const entity = entities[onlyId];

    if (group) {
      setDeletionTarget({
        ids: [onlyId],
        name: group.name,
        isGroup: true,
        isMulti: false,
      });
    } else if (entity) {
      setDeletionTarget({
        ids: [onlyId],
        name: entity.name,
        isGroup: false,
        isMulti: false,
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") setShiftPressed(true);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") setShiftPressed(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const confirmDeletion = (recursive: boolean) => {
    if (!deletionTarget) return;

    deletionTarget.ids.forEach((id) => {
      if (groups[id]) {
        removeGroup(id, deletionTarget.isMulti ? true : recursive);
      } else if (entities[id]) {
        removeEntity(id);
      }
    });

    setSelectedIds(new Set());
    setDeletionTarget(null);
  };

  const handleSelect = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (multiSelectEnabled || shiftPressed) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } else {
      setSelectedIds(new Set([id]));
    }
  };

  const handleClearSelection = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setSelectedIds(new Set());
    }
  };

  const handleToggleMultiSelect = () => {
    setMultiSelectEnabled((prev) => !prev);
  };

  const handleChangeParentClick = () => {
    if (selectedIds.size === 0) return;
    const groupOptions = Object.values(groups)
      .map((group) => group.name)
      .sort((a, b) => a.localeCompare(b));
    const hint = groupOptions.length
      ? `Available groups: ${groupOptions.join(", ")}`
      : "No groups available.";
    const input = prompt(`Move to group (leave blank for root).\n${hint}`);
    if (input === null) return;
    const trimmed = input.trim();
    const targetGroup = trimmed
      ? Object.values(groups).find((group) => group.name === trimmed)
      : null;
    if (trimmed && !targetGroup) {
      alert("Group not found. Please enter an existing group name.");
      return;
    }
    selectedIds.forEach((id) => {
      if (groups[id]) {
        changeParent(id, true, targetGroup ? targetGroup.id : null);
      } else if (entities[id]) {
        changeParent(id, false, targetGroup ? targetGroup.id : null);
      }
    });
  };

  const handleRenameClick = () => {
    if (selectedIds.size !== 1) return;
    const [onlyId] = Array.from(selectedIds);
    const group = groups[onlyId];
    const entity = entities[onlyId];
    const currentName = group?.name || entity?.name || "";
    const nextName = prompt("New name:", currentName);
    if (!nextName) return;
    if (group) {
      updateGroup(onlyId, { name: nextName });
    } else if (entity) {
      updateEntity(onlyId, { name: nextName });
    }
  };

  const collectEntityIdsFromGroup = (groupId: string, target: Set<string>) => {
    const group = groups[groupId];
    if (!group) return;
    group.childrenEntities.forEach((entityId) => target.add(entityId));
    group.childrenGroups.forEach((childGroupId) =>
      collectEntityIdsFromGroup(childGroupId, target)
    );
  };

  const handleColorClick = () => {
    if (selectedIds.size === 0) return;
    colorInputRef.current?.click();
  };

  const handleColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextColor = event.target.value;
    const entityIds = new Set<string>();
    selectedIds.forEach((id) => {
      if (groups[id]) {
        collectEntityIdsFromGroup(id, entityIds);
      } else if (entities[id]) {
        entityIds.add(id);
      }
    });

    entityIds.forEach((id) => updateEntity(id, { color: nextColor }));
  };

  const handleToggleVisibility = () => {
    if (selectedIds.size === 0) return;
    const selectedList = Array.from(selectedIds);
    const hasHidden = selectedList.some((id) => {
      if (groups[id]) return !groups[id].visible;
      if (entities[id]) return !entities[id].visible;
      return false;
    });
    const nextVisible = hasHidden;
    selectedList.forEach((id) => {
      if (groups[id]) {
        updateGroup(id, { visible: nextVisible });
      } else if (entities[id]) {
        updateEntity(id, { visible: nextVisible });
      }
    });
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportEntitiesClick = () => {
    importEntitiesInputRef.current?.click();
  };

  const serializeEntity = (entity: GeometryEntity) => ({
    type: "entity",
    entity: {
      name: entity.name,
      type: entity.type,
      visible: entity.visible,
      color: entity.color,
      opacity: entity.opacity,
      coordinateSpace: entity.coordinateSpace,
      visibleIfOutsideGraph: entity.visibleIfOutsideGraph,
      data: entity.data,
    },
  });

  const serializeGroup = (groupId: string): any => {
    const group = groups[groupId];
    if (!group) return null;
    return {
      type: "group",
      name: group.name,
      visible: group.visible,
      children: [
        ...group.childrenGroups
          .map((childId) => serializeGroup(childId))
          .filter(Boolean),
        ...group.childrenEntities
          .map((childId) => entities[childId])
          .filter(Boolean)
          .map((entity) => serializeEntity(entity)),
      ],
    };
  };

  const collectSelectedExportItems = () => {
    const selectedGroups = new Set(
      Array.from(selectedIds).filter((id) => !!groups[id])
    );
    const selectedEntities = Array.from(selectedIds).filter(
      (id) => !!entities[id]
    );

    const selectedRootGroups = Array.from(selectedGroups).filter((groupId) => {
      let current = groups[groupId]?.parentId;
      while (current) {
        if (selectedGroups.has(current)) return false;
        current = groups[current]?.parentId;
      }
      return true;
    });

    const entityOutsideSelectedGroups = selectedEntities.filter((entityId) => {
      let current = entities[entityId]?.parentId;
      while (current) {
        if (selectedGroups.has(current)) return false;
        current = groups[current]?.parentId;
      }
      return true;
    });

    return [
      ...selectedRootGroups
        .map((groupId) => serializeGroup(groupId))
        .filter(Boolean),
      ...entityOutsideSelectedGroups
        .map((entityId) => entities[entityId])
        .filter(Boolean)
        .map((entity) => serializeEntity(entity)),
    ];
  };

  const handleExportClick = () => {
    if (Object.keys(groups).length === 0 && Object.keys(entities).length === 0) {
      alert("No geometry available to export.");
      return;
    }
    setIsExportModalOpen(true);
  };

  const handleExport = (scope: "all" | "selected", name: string) => {
    const items =
      scope === "all"
        ? [
            ...rootGroupIds
              .map((groupId) => serializeGroup(groupId))
              .filter(Boolean),
            ...rootEntityIds
              .map((entityId) => entities[entityId])
              .filter(Boolean)
              .map((entity) => serializeEntity(entity)),
          ]
        : collectSelectedExportItems();

    if (items.length === 0) {
      alert("No matching items to export.");
      return;
    }

    const payload = {
      version: 1,
      items,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const trimmedName = name.trim();
    link.download = `${trimmedName || "geometry-export"}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    let parsed: any;
    try {
      parsed = JSON.parse(await file.text());
    } catch (error) {
      alert("Failed to parse Blitz file. Please select a valid JSON export.");
      return;
    }

    if (!parsed?.trajectories || !Array.isArray(parsed.trajectories)) {
      alert('Invalid Blitz file. Expected a "trajectories" array.');
      return;
    }

    parsed.trajectories.forEach((trajectory: any, trajectoryIndex: number) => {
      const groupId = `group-${uuidv4()}`;
      const groupName =
        trajectory?._name || `Trajectory ${trajectoryIndex + 1}`;
      const groupVisible = trajectory?._isVisible ?? true;
      const color = trajectory?._color || "#00D084";

      const getControlPointPosition = (controlPoint: any) => {
        const x = typeof controlPoint?._x === "number" ? controlPoint._x : 0;
        const y = typeof controlPoint?._y === "number" ? controlPoint._y : 0;
        return [x, y, 0] as [number, number, number];
      };

      const getHandlePosition = (
        controlPoint: any,
        handleKey: "_handleIn" | "_handleOut"
      ) => {
        const base = getControlPointPosition(controlPoint);
        const handle = controlPoint?.[handleKey];
        const r = typeof handle?._r === "number" ? handle._r : 0;
        const theta = typeof handle?._theta === "number" ? handle._theta : 0;
        if (!handle) return base;
        return [
          base[0] + r * Math.cos(theta),
          base[1] + r * Math.sin(theta),
          base[2],
        ] as [number, number, number];
      };

      addGroup({
        id: groupId,
        name: groupName,
        parentId: undefined,
        visible: groupVisible,
      });

      const controlPoints = Array.isArray(trajectory?._controlPoints)
        ? trajectory._controlPoints
        : [];
      controlPoints.forEach((controlPoint: any, pointIndex: number) => {
        const pointName =
          controlPoint?._name || `Control Point ${pointIndex + 1}`;
        const position = getControlPointPosition(controlPoint);

        addEntity({
          id: `entity-${uuidv4()}`,
          parentId: groupId,
          name: pointName,
          type: "point",
          visible: true,
          color,
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
          parentId: groupId,
          name: `${groupName} Bezier ${i + 1}`,
          type: "cubic-bezier",
          visible: true,
          color,
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
      alert("Failed to parse entity file. Please select valid JSON.");
      return;
    }

    if (!parsed?.items || !Array.isArray(parsed.items)) {
      alert('Invalid entity file. Expected an "items" array.');
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
      <DeletionModal
        isOpen={!!deletionTarget}
        onClose={() => setDeletionTarget(null)}
        onConfirm={confirmDeletion}
        isGroup={deletionTarget?.isGroup}
        title={
          deletionTarget?.isMulti
            ? "Delete Items"
            : deletionTarget?.isGroup
            ? "Delete Group"
            : "Delete Entity"
        }
        message={
          deletionTarget
            ? deletionTarget.isGroup
              ? `Are you sure you want to delete "${deletionTarget.name}"? You can choose to remove everything inside or preserve the children.`
              : deletionTarget.isMulti
              ? `Are you sure you want to delete ${deletionTarget.name}? This action cannot be undone.`
              : `Are you sure you want to delete the entity "${deletionTarget.name}"? This action cannot be undone.`
            : ""
        }
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        defaultName="geometry-export"
      />
      <div className="space-y-2 pb-4">
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
      <div className="flex justify-between items-center px-1 ">
        <span className="text-xs font-bold text-muted-foreground uppercase">
          Hierarchy
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1 px-1">
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleMultiSelect}
            className={clsx(
              "p-1.5 rounded transition-colors",
              multiSelectEnabled || shiftPressed
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-white hover:bg-surface-highlight"
            )}
            title={
              multiSelectEnabled || shiftPressed
                ? "Multi-select enabled"
                : "Single-select mode"
            }
          >
            <Layers size={16} />
          </button>
          <button
            onClick={handleExportClick}
            className="p-1.5 hover:bg-surface-highlight rounded text-muted-foreground hover:text-white transition-colors"
            title="Export Entities"
          >
            <Download size={16} />
          </button>
          <button
            onClick={handleCreateGroup}
            className="p-1.5 hover:bg-surface-highlight rounded text-muted-foreground hover:text-white transition-colors"
            title="New Group"
          >
            <FolderPlus size={16} />
          </button>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleVisibility}
            disabled={selectedIds.size === 0}
            className={clsx(
              "p-1.5 rounded transition-colors",
              selectedIds.size > 0
                ? "text-muted-foreground hover:text-white hover:bg-surface-highlight"
                : "text-muted-foreground/30 cursor-not-allowed"
            )}
            title={
              selectedIds.size > 0 &&
              Array.from(selectedIds).some((id) =>
                groups[id]
                  ? !groups[id].visible
                  : entities[id]
                  ? !entities[id].visible
                  : false
              )
                ? "Show Selected"
                : "Hide Selected"
            }
          >
            {selectedIds.size > 0 &&
            Array.from(selectedIds).some((id) =>
              groups[id]
                ? !groups[id].visible
                : entities[id]
                ? !entities[id].visible
                : false
            ) ? (
              <Eye size={16} />
            ) : (
              <EyeOff size={16} />
            )}
          </button>
          <button
            onClick={handleRenameClick}
            disabled={selectedIds.size !== 1}
            className={clsx(
              "p-1.5 rounded transition-colors",
              selectedIds.size === 1
                ? "text-muted-foreground hover:text-white hover:bg-surface-highlight"
                : "text-muted-foreground/30 cursor-not-allowed"
            )}
            title="Rename"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={handleColorClick}
            disabled={selectedIds.size === 0}
            className={clsx(
              "p-1.5 rounded transition-colors",
              selectedIds.size > 0
                ? "text-muted-foreground hover:text-white hover:bg-surface-highlight"
                : "text-muted-foreground/30 cursor-not-allowed"
            )}
            title="Change Color"
          >
            <Palette size={16} />
          </button>
          <button
            onClick={handleChangeParentClick}
            disabled={selectedIds.size === 0}
            className={clsx(
              "p-1.5 rounded transition-colors",
              selectedIds.size > 0
                ? "text-muted-foreground hover:text-white hover:bg-surface-highlight"
                : "text-muted-foreground/30 cursor-not-allowed"
            )}
            title="Change Parent"
          >
            <Folder size={16} />
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={selectedIds.size === 0}
            className={clsx(
              "p-1.5 hover:bg-red-500/20 rounded transition-colors",
              selectedIds.size > 0
                ? "text-red-400 hover:text-red-300 cursor-pointer"
                : "text-muted-foreground/30 cursor-not-allowed"
            )}
            title="Delete Selected"
          >
            <Trash2 size={16} />
          </button>
          <input
            ref={colorInputRef}
            type="color"
            className="hidden"
            onChange={handleColorChange}
          />
        </div>
      </div>

      <div
        className="border border-border rounded bg-background/50 min-h-[200px] overflow-hidden"
        onClick={handleClearSelection}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="p-1 space-y-0.5" onClick={handleClearSelection}>
            {rootGroupIds.length === 0 && rootEntityIds.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No geometry loaded.
                <br />
                Add via tools or scripts.
              </div>
            )}

            <SortableContext
              items={[...rootGroupIds, ...rootEntityIds]}
              strategy={verticalListSortingStrategy}
            >
              {rootGroupIds.map((gid) => (
                <GroupItem
                  key={gid}
                  groupId={gid}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                />
              ))}
              {rootEntityIds.map((eid) => (
                <EntityItem
                  key={eid}
                  entityId={eid}
                  depth={0}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      </div>

      <div className="pt-3 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase">
            Trails
          </span>
        </div>

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

        {trailSettings.mode === "controllable" && (
          <div className="space-y-2">
            {trailSettings.controllablePaused ? (
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
                onClick={() => setTrailSettings({ controllablePaused: true })}
                className="w-full py-2 rounded text-[10px] font-bold uppercase border bg-surface text-muted-foreground border-border hover:text-white transition-colors"
              >
                Stop
              </button>
            )}
            <button
              onClick={clearTrail}
              className="w-full py-2 rounded text-[10px] font-bold uppercase border border-destructive bg-destructive text-destructive-foreground hover:brightness-110 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {trailSettings.mode === "temporary" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={trailSettings.tempLength}
                onChange={(e) =>
                  setTrailSettings({ tempLength: Number(e.target.value) || 1 })
                }
                className="w-20 bg-surface border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-accent"
              />
              <select
                value={trailSettings.tempUnit}
                onChange={(e) =>
                  setTrailSettings({
                    tempUnit: e.target.value as typeof trailSettings.tempUnit,
                  })
                }
                className="bg-surface border border-border text-xs rounded px-2 py-1 outline-none focus:border-accent"
              >
                <option value="updates">Updates</option>
                <option value="seconds">Seconds</option>
              </select>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Tail fades out as it ages until disappearing.
            </p>
          </div>
        )}

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            Display
          </span>
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
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            Color
          </span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={trailSettings.color}
              onChange={(e) => setTrailSettings({ color: e.target.value })}
              className="h-8 w-12 cursor-pointer rounded border border-border bg-surface"
            />
            <span className="text-[10px] text-muted-foreground">
              {trailSettings.color}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
