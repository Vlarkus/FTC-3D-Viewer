import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ChevronRight, ChevronDown, Eye, EyeOff, Folder, Box, GripHorizontal, FileDigit, ArrowUp, ArrowDown, FolderPlus, Trash2, AlertTriangle, X, Menu, GripVertical } from 'lucide-react';
import clsx from 'clsx';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile;
};

const TypeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'point': return <div className="p-1 rounded bg-blue-500/20 text-blue-400"><Box size={12} /></div>;
        case 'line': return <div className="p-1 rounded bg-green-500/20 text-green-400"><GripHorizontal size={12} /></div>;
        case 'plane': return <div className="p-1 rounded bg-purple-500/20 text-purple-400"><FileDigit size={12} /></div>;
        default: return <div className="p-1 rounded bg-gray-500/20 text-gray-400"><Box size={12} /></div>;
    }
};

const DeletionModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isGroup = false
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: (recursive: boolean) => void,
    title: string,
    message: string,
    isGroup?: boolean
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface border border-border rounded-lg shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-border flex justify-between items-center bg-surface-highlight/30">
                    <div className="flex items-center gap-2 text-red-400">
                        <AlertTriangle size={18} />
                        <h3 className="font-bold text-sm uppercase tracking-wider">{title}</h3>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
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



const GroupItem = ({
    groupId,
    depth = 0,
    selectedId,
    onSelect,
    isParentSelected = false
}: {
    groupId: string,
    depth?: number,
    selectedId: string | null,
    onSelect: (id: string | null) => void,
    isParentSelected?: boolean
}) => {
    const group = useAppStore(state => state.groups[groupId]);
    const toggleVisibility = useAppStore(state => state.toggleVisibility);
    const moveItem = useAppStore(state => state.moveItem);
    const changeParent = useAppStore(state => state.changeParent);
    const groups = useAppStore(state => state.groups);
    const isMobile = useIsMobile();

    const [expanded, setExpanded] = useState(true);
    const isExpandedChild = expanded;
    const isSelected = selectedId === groupId;

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
                onClick={() => onSelect(isSelected ? null : groupId)}
                className={clsx(
                    "flex items-center gap-2 p-1.5 hover:bg-surface-highlight rounded cursor-pointer group text-sm select-none transition-all",
                    !group.visible && "opacity-50",
                    isSelected ? "bg-accent/20 border border-accent/30 shadow-inner text-white font-bold" :
                        isParentSelected ? "text-white opacity-80 font-medium" : "text-muted-foreground"
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
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className="p-0.5 hover:text-white text-muted-foreground"
                >
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <div className="text-yellow-500/80"><Folder size={14} /></div>

                {!isSelected ? (
                    <span className="flex-1 truncate font-medium">{group.name}</span>
                ) : (
                    <div className="flex-1 flex items-center gap-0.5 animate-in fade-in slide-in-from-left-1 duration-200">
                        {/* Move Buttons - Mobile Only */}
                        {isMobile && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); moveItem(groupId, true, 'up'); }}
                                    className="p-1 hover:text-white text-muted-foreground"
                                    title="Move Up"
                                >
                                    <ArrowUp size={12} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); moveItem(groupId, true, 'down'); }}
                                    className="p-1 hover:text-white text-muted-foreground"
                                    title="Move Down"
                                >
                                    <ArrowDown size={12} />
                                </button>
                            </>
                        )}
                        <select
                            className="bg-surface border border-border text-[10px] rounded px-1 py-0.5 outline-none focus:border-accent mx-1"
                            value={group.parentId || ""}
                            onChange={(e) => {
                                const newParent = e.target.value === "" ? null : e.target.value;
                                changeParent(groupId, true, newParent);
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="">(Root)</option>
                            {Object.values(groups)
                                .filter(g => g.id !== groupId) // Prevent self-nesting
                                .map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))
                            }
                        </select>
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleVisibility(groupId, true); }}
                            className="p-1 hover:text-white text-muted-foreground"
                        >
                            {group.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                    </div>
                )}
            </div>

            {/* Children */}
            {isExpandedChild && (
                <SortableContext items={[...group.childrenGroups, ...group.childrenEntities]} strategy={verticalListSortingStrategy}>
                    <div className="space-y-0.5">
                        {group.childrenGroups.map(childId => (
                            <GroupItem
                                key={childId}
                                groupId={childId}
                                depth={depth + 1}
                                selectedId={selectedId}
                                onSelect={onSelect}
                                isParentSelected={isSelected || isParentSelected}
                            />
                        ))}
                        {group.childrenEntities.map(childId => (
                            <EntityItem
                                key={childId}
                                entityId={childId}
                                depth={depth + 1}
                                selectedId={selectedId}
                                onSelect={onSelect}
                                isParentSelected={isSelected || isParentSelected}
                            />
                        ))}
                    </div>
                </SortableContext>
            )}
            {isExpandedChild && group.childrenGroups.length === 0 && group.childrenEntities.length === 0 && (
                <div className="text-xs text-muted-foreground pl-8 py-1 italic opacity-50">Empty Group</div>
            )}
        </div>
    );
};

const EntityItem = ({
    entityId,
    depth,
    selectedId,
    onSelect,
    isParentSelected = false
}: {
    entityId: string,
    depth: number,
    selectedId: string | null,
    onSelect: (id: string | null) => void,
    isParentSelected?: boolean
}) => {
    const entity = useAppStore(state => state.entities[entityId]);
    const toggleVisibility = useAppStore(state => state.toggleVisibility);
    const moveItem = useAppStore(state => state.moveItem);
    const changeParent = useAppStore(state => state.changeParent);
    const groups = useAppStore(state => state.groups);
    const isMobile = useIsMobile();

    const isSelected = selectedId === entityId;

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
            style={style}
            onClick={() => onSelect(isSelected ? null : entityId)}
            className={clsx(
                "flex items-center gap-2 p-1.5 hover:bg-surface-highlight rounded cursor-pointer group text-xs select-none transition-all",
                !entity.visible && "opacity-50",
                isSelected ? "bg-accent/20 border border-accent/30 shadow-inner text-sm text-white font-bold" :
                    isParentSelected ? "text-white opacity-80 font-medium" : "text-muted-foreground"
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

            {!isSelected ? (
                <span className="flex-1 truncate">{entity.name}</span>
            ) : (
                <div className="flex-1 flex items-center gap-0.5 animate-in fade-in slide-in-from-left-1 duration-200">
                    {/* Move Buttons - Mobile Only */}
                    {isMobile && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); moveItem(entityId, false, 'up'); }}
                                className="p-1 hover:text-white text-muted-foreground"
                                title="Move Up"
                            >
                                <ArrowUp size={10} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); moveItem(entityId, false, 'down'); }}
                                className="p-1 hover:text-white text-muted-foreground"
                                title="Move Down"
                            >
                                <ArrowDown size={10} />
                            </button>
                        </>
                    )}
                    <select
                        className="bg-surface border border-border text-[10px] rounded px-1 py-0.5 outline-none focus:border-accent mx-1"
                        value={entity.parentId || ""}
                        onChange={(e) => {
                            const newParent = e.target.value === "" ? null : e.target.value;
                            changeParent(entityId, false, newParent);
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">(Root)</option>
                        {Object.values(groups).map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleVisibility(entityId, false); }}
                        className="p-1 hover:text-white text-muted-foreground"
                    >
                        {entity.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                </div>
            )}
        </div>
    );
};

export const GeometryExplorer = () => {
    const rootGroupIds = useAppStore(state => state.rootGroupIds);
    const rootEntityIds = useAppStore(state => state.rootEntityIds);
    const entities = useAppStore(state => state.entities);
    const groups = useAppStore(state => state.groups);
    const createGroup = useAppStore(state => state.createGroup);
    const removeGroup = useAppStore(state => state.removeGroup);
    const removeEntity = useAppStore(state => state.removeEntity);
    const reorderItem = useAppStore(state => state.reorderItem);
    const trailSettings = useAppStore(state => state.trailSettings);
    const setTrailSettings = useAppStore(state => state.setTrailSettings);
    const clearTrail = useAppStore(state => state.clearTrail);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [deletionTarget, setDeletionTarget] = useState<{ id: string, name: string, isGroup: boolean } | null>(null);

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
        if (!selectedId) return;

        const group = groups[selectedId];
        const entity = entities[selectedId];

        if (group) {
            setDeletionTarget({ id: selectedId, name: group.name, isGroup: true });
        } else if (entity) {
            setDeletionTarget({ id: selectedId, name: entity.name, isGroup: false });
        }
    };

    const confirmDeletion = (recursive: boolean) => {
        if (!deletionTarget) return;

        if (deletionTarget.isGroup) {
            removeGroup(deletionTarget.id, recursive);
        } else {
            removeEntity(deletionTarget.id);
        }

        setSelectedId(null);
        setDeletionTarget(null);
    };

    return (
        <div className="space-y-2">
            <DeletionModal
                isOpen={!!deletionTarget}
                onClose={() => setDeletionTarget(null)}
                onConfirm={confirmDeletion}
                isGroup={deletionTarget?.isGroup}
                title={deletionTarget?.isGroup ? "Delete Group" : "Delete Entity"}
                message={deletionTarget
                    ? (deletionTarget.isGroup
                        ? `Are you sure you want to delete "${deletionTarget.name}"? You can choose to remove everything inside or preserve the children.`
                        : `Are you sure you want to delete the entity "${deletionTarget.name}"? This action cannot be undone.`)
                    : ""
                }
            />
            <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">Hierarchy</span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleCreateGroup}
                        className="p-1.5 hover:bg-surface-highlight rounded text-muted-foreground hover:text-white transition-colors"
                        title="New Group"
                    >
                        <FolderPlus size={16} />
                    </button>
                    <button
                        onClick={handleDeleteClick}
                        disabled={!selectedId}
                        className={clsx(
                            "p-1.5 hover:bg-red-500/20 rounded transition-colors",
                            selectedId ? "text-red-400 hover:text-red-300 cursor-pointer" : "text-muted-foreground/30 cursor-not-allowed"
                        )}
                        title="Delete Selected"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="border border-border rounded bg-background/50 min-h-[200px] overflow-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <div className="p-1 space-y-0.5">
                        {rootGroupIds.length === 0 && rootEntityIds.length === 0 && (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                                No geometry loaded.
                                <br />
                                Add via tools or scripts.
                            </div>
                        )}

                        <SortableContext items={[...rootGroupIds, ...rootEntityIds]} strategy={verticalListSortingStrategy}>
                            {rootGroupIds.map(gid => (
                                <GroupItem
                                    key={gid}
                                    groupId={gid}
                                    selectedId={selectedId}
                                    onSelect={setSelectedId}
                                />
                            ))}
                            {rootEntityIds.map(eid => (
                                <EntityItem
                                    key={eid}
                                    entityId={eid}
                                    depth={0}
                                    selectedId={selectedId}
                                    onSelect={setSelectedId}
                                />
                            ))}
                        </SortableContext>
                    </div>
                </DndContext>
            </div>

            <div className="pt-3 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Trails</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setTrailSettings({ mode: 'controllable' })}
                        className={clsx(
                            "py-2 rounded text-[10px] font-bold uppercase border transition-colors",
                            trailSettings.mode === 'controllable'
                                ? "bg-accent text-accent-foreground border-accent"
                                : "bg-surface text-muted-foreground border-border hover:text-white"
                        )}
                    >
                        Controllable
                    </button>
                    <button
                        onClick={() => setTrailSettings({ mode: 'temporary' })}
                        className={clsx(
                            "py-2 rounded text-[10px] font-bold uppercase border transition-colors",
                            trailSettings.mode === 'temporary'
                                ? "bg-accent text-accent-foreground border-accent"
                                : "bg-surface text-muted-foreground border-border hover:text-white"
                        )}
                    >
                        Temporary
                    </button>
                </div>

                {trailSettings.mode === 'controllable' && (
                    <div className="space-y-2">
                        {trailSettings.controllablePaused ? (
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setTrailSettings({
                                        controllablePaused: false,
                                        breakNextSegment: trailSettings.display === 'segments'
                                    })}
                                    className="py-2 rounded text-[10px] font-bold uppercase border bg-accent text-accent-foreground border-accent hover:brightness-110 transition-colors"
                                >
                                    Continue (Jump)
                                </button>
                                <button
                                    onClick={() => setTrailSettings({ controllablePaused: false, breakNextSegment: false })}
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

                {trailSettings.mode === 'temporary' && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                value={trailSettings.tempLength}
                                onChange={(e) => setTrailSettings({ tempLength: Number(e.target.value) || 1 })}
                                className="w-20 bg-surface border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-accent"
                            />
                            <select
                                value={trailSettings.tempUnit}
                                onChange={(e) => setTrailSettings({ tempUnit: e.target.value as typeof trailSettings.tempUnit })}
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
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Display</span>
                    <div className="grid grid-cols-3 gap-2">
                        {(['none', 'points', 'segments'] as const).map((mode) => (
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
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Color</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={trailSettings.color}
                            onChange={(e) => setTrailSettings({ color: e.target.value })}
                            className="h-8 w-12 cursor-pointer rounded border border-border bg-surface"
                        />
                        <span className="text-[10px] text-muted-foreground">{trailSettings.color}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
