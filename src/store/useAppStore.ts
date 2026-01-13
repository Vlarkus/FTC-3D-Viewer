import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export type CameraMode = "free" | "orbit";
export type OrbitTarget = "origin" | "robot";

export interface AxisSettings {
  min: number;
  max: number;
  size: number;
  step: number;
}

// Geometry Hierarchy Types
export type GeometryType =
  | "point"
  | "line"
  | "cubic-bezier"
  | "plane"
  | "parametric";

export type CoordinateSpace = "plot" | "world";
export type PointShape = "sphere" | "box" | "cone";
export type LineStyle = "solid" | "dashed";
export type TrailMode = "controllable" | "temporary";
export type TrailDisplay = "none" | "points" | "segments";
export type TrailLengthUnit = "updates" | "seconds";

export interface GeometryEntity {
  id: string;
  parentId?: string;
  name: string;
  type: GeometryType;
  visible: boolean;
  color: string;

  // V2 Common Properties
  opacity: number;
  coordinateSpace: CoordinateSpace;
  visibleIfOutsideGraph: boolean;

  data: any;
  // TYPE SPECIFIC DATA:
  // point: { position: [x,y,z], radius: number, shape: PointShape }
  // line: { start: [x,y,z], end: [x,y,z], thickness: number, style: LineStyle, dashSize?: number, gapSize?: number }
  // cubic-bezier: { start: [x,y,z], control1: [x,y,z], control2: [x,y,z], end: [x,y,z], thickness: number, style: LineStyle, dashSize?: number, gapSize?: number }
  // parametric: {
  //    equation: { x: string, y: string, z: string }, // Full parametric [x(u,v), y(u,v), z(u,v)]
  //    domain: { u: [min, max], v: [min, max] }
  // }
  // plane: { normal: [x,y,z], constant: number, size: number }
}

export interface GeometryGroup {
  id: string;
  parentId?: string;
  name: string;
  visible: boolean;
  childrenGroups: string[];
  childrenEntities: string[];
}

interface AppState {
  // Connection
  ipAddress: string;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  setIpAddress: (ip: string) => void;
  setConnectionStatus: (
    status: "disconnected" | "connecting" | "connected" | "error"
  ) => void;
  isPaused: boolean;
  setPaused: (paused: boolean) => void;

  // View & Camera
  cameraMode: CameraMode;
  orbitTarget: OrbitTarget;
  cameraSpeed: number;
  setCameraMode: (mode: CameraMode) => void;
  setOrbitTarget: (target: OrbitTarget) => void;
  setCameraSpeed: (speed: number) => void;

  // Grid / Plot Box
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  axes: { x: AxisSettings; y: AxisSettings; z: AxisSettings };
  setAxisSettings: (
    axis: "x" | "y" | "z",
    settings: Partial<AxisSettings>
  ) => void;

  // Geometry System
  groups: Record<string, GeometryGroup>;
  entities: Record<string, GeometryEntity>;
  rootGroupIds: string[];
  rootEntityIds: string[];

  // Telemetry Mapping
  telemetryMapping: { x?: string; y?: string; z?: string };
  setTelemetryMapping: (axis: "x" | "y" | "z", key: string | undefined) => void;

  // Actions
  addGroup: (
    group: Omit<GeometryGroup, "childrenGroups" | "childrenEntities">
  ) => void;
  addEntity: (entity: GeometryEntity) => void;
  updateGroup: (id: string, updates: Partial<GeometryGroup>) => void;
  updateEntity: (id: string, updates: Partial<GeometryEntity>) => void;
  createGroup: (name: string, parentId?: string) => void;
  moveItem: (id: string, isGroup: boolean, direction: "up" | "down") => void;
  changeParent: (
    id: string,
    isGroup: boolean,
    newParentId: string | null
  ) => void;
  toggleVisibility: (id: string, isGroup: boolean) => void;
  removeGroup: (id: string, recursive?: boolean) => void;
  removeEntity: (id: string) => void;
  reorderItem: (activeId: string, overId: string, isGroup: boolean) => void;
  loadGeometryConfig: (config: any[]) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;

  // Robot Visual Settings
  robotSettings: {
    showRobot: boolean;
    showCoordinates: boolean;
    showProjections: boolean;
    robotSize: number;
    robotColor: string;
  };
  setRobotSettings: (settings: Partial<AppState["robotSettings"]>) => void;

  // Robot Trail Settings
  trailSettings: {
    mode: TrailMode;
    display: TrailDisplay;
    color: string;
    controllablePaused: boolean;
    breakNextSegment: boolean;
    tempLength: number;
    tempUnit: TrailLengthUnit;
  };
  setTrailSettings: (settings: Partial<AppState["trailSettings"]>) => void;
  clearTrail: () => void;
  trailClearToken: number;
}

export const useAppStore = create<AppState>((set) => ({
  // Connection
  ipAddress: "",
  connectionStatus: "disconnected",
  setIpAddress: (ip) => set({ ipAddress: ip }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  isPaused: false,
  setPaused: (paused) => set({ isPaused: paused }),

  // View
  cameraMode: "orbit",
  orbitTarget: "origin",
  cameraSpeed: 10,
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setOrbitTarget: (target) => set({ orbitTarget: target }),
  setCameraSpeed: (speed) => set({ cameraSpeed: speed }),

  // Grid
  showGrid: true,
  setShowGrid: (show) => set({ showGrid: show }),
  axes: {
    x: { min: -10, max: 10, size: 10, step: 1 },
    y: { min: -10, max: 10, size: 10, step: 1 },
    z: { min: -10, max: 10, size: 10, step: 1 },
  },
  setAxisSettings: (axis, settings) =>
    set((state) => {
      const newSettings = { ...state.axes[axis], ...settings };
      // Enforce step >= 0
      if (newSettings.step < 0) newSettings.step = 0;
      return {
        axes: { ...state.axes, [axis]: newSettings },
      };
    }),

  // Telemetry Mapping
  telemetryMapping: { x: "x", y: "y", z: "z" },
  setTelemetryMapping: (axis, key) =>
    set((state) => {
      const newMapping = { ...state.telemetryMapping, [axis]: key };
      // Ensure exclusivity: if this key was used elsewhere, remove it
      if (key) {
        if (axis !== "x" && state.telemetryMapping.x === key)
          newMapping.x = undefined;
        if (axis !== "y" && state.telemetryMapping.y === key)
          newMapping.y = undefined;
        if (axis !== "z" && state.telemetryMapping.z === key)
          newMapping.z = undefined;
      }
      return { telemetryMapping: newMapping };
    }),

  // Geometry (initialized empty, loaded from config)
  groups: {},
  entities: {},
  rootGroupIds: [],
  rootEntityIds: [],

  addGroup: (group) =>
    set((state) => {
      const newGroup: GeometryGroup = {
        ...group,
        childrenGroups: [],
        childrenEntities: [],
      };
      const newState = {
        groups: { ...state.groups, [group.id]: newGroup },
      };

      if (group.parentId && state.groups[group.parentId]) {
        return {
          groups: {
            ...newState.groups,
            [group.parentId]: {
              ...state.groups[group.parentId],
              childrenGroups: [
                ...state.groups[group.parentId].childrenGroups,
                group.id,
              ],
            },
          },
        };
      } else {
        return {
          groups: newState.groups,
          rootGroupIds: [...state.rootGroupIds, group.id],
        };
      }
    }),

  addEntity: (entity) =>
    set((state) => {
      const safeEntity = {
        ...entity,
        opacity: entity.opacity ?? 1.0,
        coordinateSpace: entity.coordinateSpace ?? "plot",
        visibleIfOutsideGraph: entity.visibleIfOutsideGraph ?? true,
      };

      const newState = {
        entities: { ...state.entities, [entity.id]: safeEntity },
      };

      if (entity.parentId && state.groups[entity.parentId]) {
        return {
          entities: newState.entities,
          groups: {
            ...state.groups,
            [entity.parentId]: {
              ...state.groups[entity.parentId],
              childrenEntities: [
                ...state.groups[entity.parentId].childrenEntities,
                entity.id,
              ],
            },
          },
        };
      } else {
        return {
          entities: newState.entities,
          rootEntityIds: [...state.rootEntityIds, entity.id],
        };
      }
    }),

  updateGroup: (id, updates) =>
    set((state) => {
      const group = state.groups[id];
      if (!group) return {};
      return {
        groups: {
          ...state.groups,
          [id]: { ...group, ...updates },
        },
      };
    }),

  updateEntity: (id, updates) =>
    set((state) => {
      const entity = state.entities[id];
      if (!entity) return {};
      return {
        entities: {
          ...state.entities,
          [id]: {
            ...entity,
            ...updates,
            data: updates.data
              ? { ...entity.data, ...updates.data }
              : entity.data,
          },
        },
      };
    }),

  createGroup: (name, parentId) =>
    set((state) => {
      const id = `group-${uuidv4()}`;
      const newGroup: GeometryGroup = {
        id,
        name,
        parentId,
        visible: true,
        childrenGroups: [],
        childrenEntities: [],
      };

      const newState = {
        groups: { ...state.groups, [id]: newGroup },
      };

      if (parentId && state.groups[parentId]) {
        return {
          groups: {
            ...newState.groups,
            [parentId]: {
              ...state.groups[parentId],
              childrenGroups: [...state.groups[parentId].childrenGroups, id],
            },
          },
        };
      } else {
        return {
          groups: newState.groups,
          rootGroupIds: [...state.rootGroupIds, id],
        };
      }
    }),

  moveItem: (id, isGroup, direction) =>
    set((state) => {
      const parentId = isGroup
        ? state.groups[id]?.parentId
        : state.entities[id]?.parentId;

      const getNewList = (list: string[]) => {
        const index = list.indexOf(id);
        if (index === -1) return list;
        const newList = [...list];
        const swapIndex = direction === "up" ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= list.length) return list;
        [newList[index], newList[swapIndex]] = [
          newList[swapIndex],
          newList[index],
        ];
        return newList;
      };

      if (parentId) {
        const parent = state.groups[parentId];
        if (!parent) return {};
        return {
          groups: {
            ...state.groups,
            [parentId]: {
              ...parent,
              childrenGroups: isGroup
                ? getNewList(parent.childrenGroups)
                : parent.childrenGroups,
              childrenEntities: !isGroup
                ? getNewList(parent.childrenEntities)
                : parent.childrenEntities,
            },
          },
        };
      } else {
        return {
          rootGroupIds: isGroup
            ? getNewList(state.rootGroupIds)
            : state.rootGroupIds,
          rootEntityIds: !isGroup
            ? getNewList(state.rootEntityIds)
            : state.rootEntityIds,
        };
      }
    }),

  changeParent: (id, isGroup, newParentId) =>
    set((state) => {
      const oldParentId = isGroup
        ? state.groups[id]?.parentId
        : state.entities[id]?.parentId;
      if (oldParentId === newParentId) return {};

      // 1. Remove from old parent
      let nextRootGroupIds = [...state.rootGroupIds];
      let nextRootEntityIds = [...state.rootEntityIds];
      let nextGroups = { ...state.groups };

      if (oldParentId) {
        const oldParent = nextGroups[oldParentId];
        nextGroups[oldParentId] = {
          ...oldParent,
          childrenGroups: isGroup
            ? oldParent.childrenGroups.filter((gid) => gid !== id)
            : oldParent.childrenGroups,
          childrenEntities: !isGroup
            ? oldParent.childrenEntities.filter((eid) => eid !== id)
            : oldParent.childrenEntities,
        };
      } else {
        if (isGroup)
          nextRootGroupIds = nextRootGroupIds.filter((gid) => gid !== id);
        else nextRootEntityIds = nextRootEntityIds.filter((eid) => eid !== id);
      }

      // 2. Update item's parent pointer
      if (isGroup) {
        nextGroups[id] = {
          ...nextGroups[id],
          parentId: newParentId || undefined,
        };
      } else {
        const nextEntities = { ...state.entities };
        nextEntities[id] = {
          ...nextEntities[id],
          parentId: newParentId || undefined,
        };
        // Need to return entities too if we changed it
      }

      // 3. Add to new parent
      if (newParentId) {
        const newParent = nextGroups[newParentId];
        nextGroups[newParentId] = {
          ...newParent,
          childrenGroups: isGroup
            ? [...newParent.childrenGroups, id]
            : newParent.childrenGroups,
          childrenEntities: !isGroup
            ? [...newParent.childrenEntities, id]
            : newParent.childrenEntities,
        };
      } else {
        if (isGroup) nextRootGroupIds.push(id);
        else nextRootEntityIds.push(id);
      }

      const result: any = {
        groups: nextGroups,
        rootGroupIds: nextRootGroupIds,
        rootEntityIds: nextRootEntityIds,
      };

      if (!isGroup) {
        result.entities = {
          ...state.entities,
          [id]: { ...state.entities[id], parentId: newParentId || undefined },
        };
      }

      return result;
    }),

  toggleVisibility: (id, isGroup) =>
    set((state) => {
      if (isGroup) {
        const group = state.groups[id];
        if (!group) return {};
        return {
          groups: {
            ...state.groups,
            [id]: { ...group, visible: !group.visible },
          },
        };
      } else {
        const entity = state.entities[id];
        if (!entity) return {};
        return {
          entities: {
            ...state.entities,
            [id]: { ...entity, visible: !entity.visible },
          },
        };
      }
    }),

  removeGroup: (id, recursive = true) =>
    set((state) => {
      const group = state.groups[id];
      if (!group) return {};

      let nextGroups = { ...state.groups };
      let nextEntities = { ...state.entities };
      let nextRootGroupIds = state.rootGroupIds.filter((gid) => gid !== id);
      let nextRootEntityIds = state.rootEntityIds.filter(
        (eid) => !group.childrenEntities.includes(eid)
      );

      // Recursive cleanup helper
      const performDeepCleanup = (gid: string) => {
        const g = nextGroups[gid];
        if (!g) return;

        // Clean up sub-children first
        g.childrenGroups.forEach(performDeepCleanup);

        // Clean up entities
        g.childrenEntities.forEach((eid) => {
          delete nextEntities[eid];
          nextRootEntityIds = nextRootEntityIds.filter((reid) => reid !== eid);
        });

        // Clean up the group itself
        delete nextGroups[gid];
        nextRootGroupIds = nextRootGroupIds.filter((rgid) => rgid !== gid);
      };

      if (recursive) {
        // Delete all children
        group.childrenGroups.forEach(performDeepCleanup);
        group.childrenEntities.forEach((eid) => {
          delete nextEntities[eid];
          nextRootEntityIds = nextRootEntityIds.filter((reid) => reid !== eid);
        });
        delete nextGroups[id];
      } else {
        // Re-parent children to the group's parent or root
        const newParentId = group.parentId;

        // Move children groups
        group.childrenGroups.forEach((gid) => {
          if (nextGroups[gid]) {
            nextGroups[gid] = {
              ...nextGroups[gid],
              parentId: newParentId || undefined,
            };
          }
          if (!newParentId) nextRootGroupIds.push(gid);
        });

        // Move children entities
        group.childrenEntities.forEach((eid) => {
          if (nextEntities[eid]) {
            nextEntities[eid] = {
              ...nextEntities[eid],
              parentId: newParentId || undefined,
            };
          }
          if (!newParentId) nextRootEntityIds.push(eid);
        });

        // Update parent's children lists if applicable
        if (newParentId && nextGroups[newParentId]) {
          nextGroups[newParentId] = {
            ...nextGroups[newParentId],
            childrenGroups: [
              ...nextGroups[newParentId].childrenGroups.filter(
                (gid) => gid !== id
              ),
              ...group.childrenGroups,
            ],
            childrenEntities: [
              ...nextGroups[newParentId].childrenEntities,
              ...group.childrenEntities,
            ],
          };
        }

        delete nextGroups[id];
      }

      // Final safety check: remove from parent if it was a child and not handled by recursive/non-recursive move
      const oldParentId = group.parentId;
      if (
        oldParentId &&
        nextGroups[oldParentId] &&
        (recursive ||
          !nextGroups[oldParentId].childrenGroups.includes(
            group.childrenGroups[0] || ""
          ))
      ) {
        // Ensure the group is removed from its parent's list
        nextGroups[oldParentId] = {
          ...nextGroups[oldParentId],
          childrenGroups: nextGroups[oldParentId].childrenGroups.filter(
            (gid) => gid !== id
          ),
        };
      }

      return {
        groups: nextGroups,
        entities: nextEntities,
        rootGroupIds: nextRootGroupIds,
        rootEntityIds: nextRootEntityIds,
      };
    }),

  removeEntity: (id) =>
    set((state) => {
      const entity = state.entities[id];
      if (!entity) return {};

      const parentId = entity.parentId;
      let nextGroups = { ...state.groups };
      let nextRootEntityIds = state.rootEntityIds.filter((eid) => eid !== id);

      if (parentId && nextGroups[parentId]) {
        nextGroups[parentId] = {
          ...nextGroups[parentId],
          childrenEntities: nextGroups[parentId].childrenEntities.filter(
            (eid) => eid !== id
          ),
        };
      }

      const { [id]: deleted, ...remainingEntities } = state.entities;
      return {
        entities: remainingEntities,
        groups: nextGroups,
        rootEntityIds: nextRootEntityIds,
      };
    }),

  reorderItem: (activeId, overId, isGroup) =>
    set((state) => {
      const activeItem = isGroup
        ? state.groups[activeId]
        : state.entities[activeId];
      const overItem = isGroup ? state.groups[overId] : state.entities[overId];

      if (!activeItem || !overItem) return {};
      if (activeItem.parentId !== overItem.parentId) return {};

      const parentId = activeItem.parentId;

      const moveInArray = (arr: string[], from: string, to: string) => {
        const oldIndex = arr.indexOf(from);
        const newIndex = arr.indexOf(to);
        if (oldIndex === -1 || newIndex === -1) return arr;
        const newArr = [...arr];
        newArr.splice(oldIndex, 1);
        newArr.splice(newIndex, 0, from);
        return newArr;
      };

      if (parentId) {
        const parent = state.groups[parentId];
        if (!parent) return {};
        return {
          groups: {
            ...state.groups,
            [parentId]: {
              ...parent,
              childrenGroups: isGroup
                ? moveInArray(parent.childrenGroups, activeId, overId)
                : parent.childrenGroups,
              childrenEntities: !isGroup
                ? moveInArray(parent.childrenEntities, activeId, overId)
                : parent.childrenEntities,
            },
          },
        };
      } else {
        return {
          rootGroupIds: isGroup
            ? moveInArray(state.rootGroupIds, activeId, overId)
            : state.rootGroupIds,
          rootEntityIds: !isGroup
            ? moveInArray(state.rootEntityIds, activeId, overId)
            : state.rootEntityIds,
        };
      }
    }),

  loadGeometryConfig: (config) =>
    set(() => {
      const newGroups: Record<string, GeometryGroup> = {};
      const newEntities: Record<string, GeometryEntity> = {};
      const newRootGroupIds: string[] = [];

      const processConfig = (item: any, parentId?: string): string => {
        const id = uuidv4();

        if (item.type === "group") {
          // Create group
          const group: GeometryGroup = {
            id,
            name: item.name,
            visible: item.options.visible ?? true,
            parentId,
            childrenGroups: [],
            childrenEntities: [],
          };

          // Process children
          item.children.forEach((child: any) => {
            const childId = processConfig(child, id);
            if (child.type === "group") {
              group.childrenGroups.push(childId);
            } else {
              group.childrenEntities.push(childId);
            }
          });

          newGroups[id] = group;

          // Add to root if no parent
          if (!parentId) {
            newRootGroupIds.push(id);
          }
        } else {
          // Create entity (point, segment, parametric)
          let entity: GeometryEntity;

          if (item.type === "point") {
            entity = {
              id,
              name: item.name,
              type: "point",
              parentId,
              visible: true,
              color: item.options.color || "red",
              opacity: item.options.opacity ?? 1,
              coordinateSpace: item.options.coordinateSpace || "plot",
              visibleIfOutsideGraph: item.options.visibleIfOutsideGraph ?? true,
              data: {
                position: item.position,
                radius: item.options.radius ?? 0.5,
                shape: item.options.shape || "sphere",
              },
            };
          } else if (item.type === "segment") {
            entity = {
              id,
              name: item.name,
              type: "line",
              parentId,
              visible: true,
              color: item.options.color || "green",
              opacity: item.options.opacity ?? 1,
              coordinateSpace: item.options.coordinateSpace || "plot",
              visibleIfOutsideGraph: item.options.visibleIfOutsideGraph ?? true,
              data: {
                start: item.start,
                end: item.end,
                thickness: item.options.thickness ?? 2,
                style: item.options.style || "solid",
                dashSize: item.options.dashSize,
                gapSize: item.options.gapSize,
              },
            };
          } else if (item.type === "cubic-bezier") {
            entity = {
              id,
              name: item.name,
              type: "cubic-bezier",
              parentId,
              visible: true,
              color: item.options.color || "green",
              opacity: item.options.opacity ?? 1,
              coordinateSpace: item.options.coordinateSpace || "plot",
              visibleIfOutsideGraph: item.options.visibleIfOutsideGraph ?? true,
              data: {
                start: item.start,
                control1: item.control1,
                control2: item.control2,
                end: item.end,
                thickness: item.options.thickness ?? 2,
                style: item.options.style || "solid",
                dashSize: item.options.dashSize,
                gapSize: item.options.gapSize,
              },
            };
          } else if (item.type === "parametric") {
            entity = {
              id,
              name: item.name,
              type: "parametric",
              parentId,
              visible: true,
              color: item.options.color || "blue",
              opacity: item.options.opacity ?? 1,
              coordinateSpace: item.options.coordinateSpace || "plot",
              visibleIfOutsideGraph: item.options.visibleIfOutsideGraph ?? true,
              data: {
                equation: item.equation,
                domain: item.domain,
              },
            };
          } else if (item.type === "plane") {
            entity = {
              id,
              name: item.name,
              type: "plane",
              parentId,
              visible: true,
              color: item.options.color || "white",
              opacity: item.options.opacity ?? 0.5,
              coordinateSpace: item.options.coordinateSpace || "plot",
              visibleIfOutsideGraph: item.options.visibleIfOutsideGraph ?? true,
              data: {
                normal: item.normal,
                constant: item.constant ?? 0,
                size: item.options.size ?? 20,
              },
            };
          } else {
            throw new Error(`Unknown entity type: ${item.type}`);
          }

          newEntities[id] = entity;
        }

        return id;
      };

      // Process all top-level items
      config.forEach((item: any) => processConfig(item));

      return {
        groups: newGroups,
        entities: newEntities,
        rootGroupIds: newRootGroupIds,
        rootEntityIds: [], // Config based geometry always uses groups for now
      };
    }),
  isSidebarOpen: window.innerWidth > 768,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  sidebarWidth: 320,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  // Robot Settings
  robotSettings: {
    showRobot: true,
    showCoordinates: true,
    showProjections: true,
    robotSize: 0.1,
    robotColor: "#800000",
  },
  setRobotSettings: (settings) =>
    set((state) => ({
      robotSettings: { ...state.robotSettings, ...settings },
    })),

  // Robot Trails
  trailSettings: {
    mode: "controllable",
    display: "segments",
    color: "#f59e0b",
    controllablePaused: true,
    breakNextSegment: false,
    tempLength: 120,
    tempUnit: "updates",
  },
  setTrailSettings: (settings) =>
    set((state) => ({
      trailSettings: { ...state.trailSettings, ...settings },
    })),
  clearTrail: () =>
    set((state) => ({
      trailClearToken: state.trailClearToken + 1,
    })),
  trailClearToken: 0,
}));
