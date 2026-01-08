import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ChevronRight, ChevronDown, Eye, EyeOff, Folder, Box, GripHorizontal, FileDigit, Plus } from 'lucide-react';
import clsx from 'clsx';

const TypeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'point': return <div className="p-1 rounded bg-blue-500/20 text-blue-400"><Box size={12} /></div>;
        case 'line': return <div className="p-1 rounded bg-green-500/20 text-green-400"><GripHorizontal size={12} /></div>;
        case 'plane': return <div className="p-1 rounded bg-purple-500/20 text-purple-400"><FileDigit size={12} /></div>;
        default: return <div className="p-1 rounded bg-gray-500/20 text-gray-400"><Box size={12} /></div>;
    }
};

const GroupItem = ({ groupId, depth = 0 }: { groupId: string, depth?: number }) => {
    const group = useAppStore(state => state.groups[groupId]);
    const toggleVisibility = useAppStore(state => state.toggleVisibility);
    const [expanded, setExpanded] = useState(true);

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
                    className="p-1 hover:text-white text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
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
                className="p-1 hover:text-white text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
                {entity.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
        </div>
    );
};

export const GeometryExplorer = () => {
    const rootGroupIds = useAppStore(state => state.rootGroupIds);
    // We could add a way to Create Root Group here

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">Hierarchy</span>
                <button
                    onClick={() => {
                        // Demo Data Injection
                        const api = (window as any).ftc3d;
                        if (api) {
                            const rootId = api.addGroup("V2 Demo");

                            // Point with Shape & Opacity
                            api.addPoint("Translucent Box", [0, 5, 0], rootId, {
                                color: "#00ff00",
                                shape: 'box',
                                radius: 2,
                                opacity: 0.5
                            });

                            // Dashed Segment
                            api.addSegment("Dashed Line", [-10, 0, -10], [10, 10, 10], rootId, {
                                color: "#ff00ff",
                                style: 'dashed',
                                thickness: 3
                            });

                            // Full Parametric Surface (e.g. Spiral / Helix Ramp)
                            // x = u * cos(v), z = u * sin(v), y = v (Height) mapped to Y input?
                            // Remember: Input X->VisX, Input Y->VisZ, Input Z->VisY
                            // If we want a visual spiral up:
                            // We need Input [x, z_height, y_depth]
                            api.addParametricSurface("Spiral Ramp", {
                                x: "u * Math.cos(v)",
                                y: "u * Math.sin(v)", // Depth
                                z: "v * 2"            // Height
                            }, { u: [2, 5], v: [0, 20] }, rootId, {
                                color: "#00ccff",
                                opacity: 0.8
                            });
                            // Capped Line (Testing Clip)
                            // This line spans from -20 to +20, but if grid is 10, it should clip.
                            api.addSegment("Capped Infinite Line", [-100, 5, -100], [100, 5, 100], rootId, {
                                color: "orange",
                                thickness: 5,
                                visibleIfOutsideGraph: false
                            });
                        }
                    }}
                    className="text-[10px] bg-accent/20 hover:bg-accent/40 text-accent px-2 py-0.5 rounded flex items-center gap-1"
                >
                    <Plus size={10} /> Demo V2
                </button>
            </div>

            <div className="border border-border rounded bg-background/50 min-h-[200px] overflow-hidden">
                <div className="p-1 space-y-0.5">
                    {rootGroupIds.length === 0 && (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                            No geometry loaded.
                            <br />
                            Add groups via API or scripts.
                        </div>
                    )}
                    {rootGroupIds.map(gid => (
                        <GroupItem key={gid} groupId={gid} />
                    ))}
                </div>
            </div>
        </div>
    );
};
