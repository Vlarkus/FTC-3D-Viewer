import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ChevronRight, ChevronDown, Eye, EyeOff, Folder, Box, GripHorizontal, FileDigit } from 'lucide-react';
import clsx from 'clsx';

const TypeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'point': return <div className="p-1 rounded bg-blue-500/20 text-blue-400"><Box size={12} /></div>;
        case 'line': return <div className="p-1 rounded bg-green-500/20 text-green-400"><GripHorizontal size={12} /></div>;
        case 'plane': return <div className="p-1 rounded bg-purple-500/20 text-purple-400"><FileDigit size={12} /></div>;
        default: return <div className="p-1 rounded bg-gray-500/20 text-gray-400"><Box size={12} /></div>;
    }
};

// Helper for Touch Detection (could be a hook, but keeping it local for speed as requested)
const useIsTouch = () => {
    const [isTouch, setIsTouch] = useState(false);
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
            const hasTouchPoints = navigator.maxTouchPoints > 0;
            const hasTouchEvents = 'ontouchstart' in window;

            if (hasCoarsePointer || hasTouchPoints || hasTouchEvents) {
                setIsTouch(true);
            }
        }
    }, []);
    return isTouch;
};

const GroupItem = ({ groupId, depth = 0 }: { groupId: string, depth?: number }) => {
    const group = useAppStore(state => state.groups[groupId]);
    const toggleVisibility = useAppStore(state => state.toggleVisibility);
    const [expanded, setExpanded] = useState(true);
    const isTouch = useIsTouch();

    if (!group) return null;

    return (
        <div>
            {/* Header */}
            <div
                className={clsx(
                    "flex items-center gap-2 p-1.5 hover:bg-surface-highlight rounded cursor-pointer group text-sm select-none",
                    !group.visible && "opacity-50"
                )}
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className="p-0.5 hover:text-white text-muted-foreground"
                >
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <div className="text-yellow-500/80"><Folder size={14} /></div>

                <span className="flex-1 truncate font-medium">{group.name}</span>

                <button
                    onClick={(e) => { e.stopPropagation(); toggleVisibility(groupId, true); }}
                    className={clsx(
                        "p-1 hover:text-white text-muted-foreground transition-opacity",
                        // On touch: always visible (opacity-100). On desktop: visible on group hover.
                        isTouch ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                >
                    {group.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
            </div>

            {/* Children */}
            {expanded && (
                <div>
                    {group.childrenGroups.map(childId => (
                        <GroupItem key={childId} groupId={childId} depth={depth + 1} />
                    ))}
                    {group.childrenEntities.map(childId => (
                        <EntityItem key={childId} entityId={childId} depth={depth + 1} />
                    ))}
                    {group.childrenGroups.length === 0 && group.childrenEntities.length === 0 && (
                        <div className="text-xs text-muted-foreground pl-8 py-1 italic opacity-50">Empty Group</div>
                    )}
                </div>
            )}
        </div>
    );
};

const EntityItem = ({ entityId, depth }: { entityId: string, depth: number }) => {
    const entity = useAppStore(state => state.entities[entityId]);
    const toggleVisibility = useAppStore(state => state.toggleVisibility);
    const isTouch = useIsTouch();

    if (!entity) return null;

    return (
        <div
            className={clsx(
                "flex items-center gap-2 p-1.5 hover:bg-surface-highlight rounded cursor-pointer group text-xs select-none",
                !entity.visible && "opacity-50"
            )}
            style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
            <div className="w-4" /> {/* Spacer for chevron */}
            <TypeIcon type={entity.type} />
            <span className="flex-1 truncate">{entity.name}</span>
            <button
                onClick={(e) => { e.stopPropagation(); toggleVisibility(entityId, false); }}
                className={clsx(
                    "p-1 hover:text-white text-muted-foreground transition-opacity",
                    isTouch ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
            >
                {entity.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
        </div>
    );
};

export const GeometryExplorer = () => {
    const rootGroupIds = useAppStore(state => state.rootGroupIds);
    const rootEntityIds = useAppStore(state => state.rootEntityIds);

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">Hierarchy</span>
            </div>

            <div className="border border-border rounded bg-background/50 min-h-[200px] overflow-hidden">
                <div className="p-1 space-y-0.5">
                    {rootGroupIds.length === 0 && rootEntityIds.length === 0 && (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                            No geometry loaded.
                            <br />
                            Add via tools or scripts.
                        </div>
                    )}
                    {rootGroupIds.map(gid => (
                        <GroupItem key={gid} groupId={gid} />
                    ))}
                    {rootEntityIds.map(eid => (
                        <EntityItem key={eid} entityId={eid} depth={0} />
                    ))}
                </div>
            </div>
        </div>
    );
};
