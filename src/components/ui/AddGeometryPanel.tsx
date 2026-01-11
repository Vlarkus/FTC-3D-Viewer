import React, { useState } from 'react';
import { useAppStore, type GeometryType, type GeometryEntity } from '../../store/useAppStore';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const AddGeometryPanel: React.FC = () => {
    const addEntity = useAppStore(state => state.addEntity);
    const [type, setType] = useState<GeometryType>('point');
    const [name, setName] = useState('');
    const [color, setColor] = useState('#ff0000');

    type BezierPoints = {
        start: [number, number, number];
        control1: [number, number, number];
        control2: [number, number, number];
        end: [number, number, number];
    };

    // Type specific states
    const [pointPos, setPointPos] = useState({ x: 0, y: 0, z: 0 });
    const [linePoints, setLinePoints] = useState({ start: [0, 0, 0], end: [1, 1, 1] });
    const [bezierPoints, setBezierPoints] = useState<BezierPoints>({
        start: [0, 0, 0],
        control1: [1, 0, 0],
        control2: [2, 0, 0],
        end: [3, 0, 0]
    });
    const [parametric, setParametric] = useState({
        x: 'u', y: 'v', z: 'sin(u)*cos(v)',
        uMin: -5, uMax: 5, vMin: -5, vMax: 5
    });
    const [plane, setPlane] = useState({ normal: [0, 0, 1], constant: 0, size: 20 });

    const handleAdd = () => {
        const id = uuidv4();
        let entityData: any = {};

        switch (type) {
            case 'point':
                entityData = { position: [pointPos.x, pointPos.y, pointPos.z], radius: 0.2, shape: 'sphere' };
                break;
            case 'line':
                entityData = { start: linePoints.start, end: linePoints.end, thickness: 2, style: 'solid' };
                break;
            case 'cubic-bezier':
                entityData = {
                    start: bezierPoints.start,
                    control1: bezierPoints.control1,
                    control2: bezierPoints.control2,
                    end: bezierPoints.end,
                    thickness: 2,
                    style: 'solid'
                };
                break;
            case 'parametric':
                entityData = {
                    equation: { x: parametric.x, y: parametric.y, z: parametric.z },
                    domain: { u: [parametric.uMin, parametric.uMax], v: [parametric.vMin, parametric.vMax] }
                };
                break;
            case 'plane':
                entityData = { normal: plane.normal, constant: plane.constant, size: plane.size };
                break;
        }

        const newEntity: GeometryEntity = {
            id,
            name: name || `New ${type}`,
            type,
            visible: true,
            color,
            opacity: 1,
            coordinateSpace: 'plot',
            visibleIfOutsideGraph: true,
            data: entityData
        };

        addEntity(newEntity);
        setName('');
    };

    return (
        <div className="space-y-4 bg-background/30 p-3 rounded border border-border/50">
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Type</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as GeometryType)}
                        className="w-full bg-surface border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-accent"
                    >
                        <option value="point">Point</option>
                        <option value="line">Segment</option>
                        <option value="cubic-bezier">Cubic Bezier</option>
                        <option value="plane">Plane</option>
                        <option value="parametric">Parametric</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Color</label>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full h-7 bg-surface border border-border rounded px-1 py-0.5 cursor-pointer"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Entity name..."
                    className="w-full bg-surface border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-accent"
                />
            </div>

            {/* Type Specific Forms */}
            {type === 'point' && (
                <div className="grid grid-cols-3 gap-2">
                    {['x', 'y', 'z'].map((axis) => (
                        <div key={axis} className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">{axis}</label>
                            <input
                                type="number"
                                value={pointPos[axis as 'x' | 'y' | 'z']}
                                onChange={(e) => setPointPos({ ...pointPos, [axis]: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-surface border border-border rounded px-2 py-1 text-xs"
                            />
                        </div>
                    ))}
                </div>
            )}

            {type === 'line' && (
                <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                        <label className="col-span-3 text-[10px] font-bold uppercase text-muted-foreground">Start [x,y,z]</label>
                        {[0, 1, 2].map(i => (
                            <input
                                key={i}
                                type="number"
                                value={linePoints.start[i]}
                                onChange={(e) => {
                                    const newStart = [...linePoints.start];
                                    newStart[i] = parseFloat(e.target.value) || 0;
                                    setLinePoints({ ...linePoints, start: newStart });
                                }}
                                className="w-full bg-surface border border-border rounded px-2 py-1 text-xs"
                            />
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <label className="col-span-3 text-[10px] font-bold uppercase text-muted-foreground">End [x,y,z]</label>
                        {[0, 1, 2].map(i => (
                            <input
                                key={i}
                                type="number"
                                value={linePoints.end[i]}
                                onChange={(e) => {
                                    const newEnd = [...linePoints.end];
                                    newEnd[i] = parseFloat(e.target.value) || 0;
                                    setLinePoints({ ...linePoints, end: newEnd });
                                }}
                                className="w-full bg-surface border border-border rounded px-2 py-1 text-xs"
                            />
                        ))}
                    </div>
                </div>
            )}

            {type === 'cubic-bezier' && (
                <div className="space-y-2">
                    {([
                        ['start', 'Start [x,y,z]'],
                        ['control1', 'Control 1 [x,y,z]'],
                        ['control2', 'Control 2 [x,y,z]'],
                        ['end', 'End [x,y,z]']
                    ] as const).map(([key, label]) => (
                        <div key={key} className="grid grid-cols-3 gap-2">
                            <label className="col-span-3 text-[10px] font-bold uppercase text-muted-foreground">{label}</label>
                            {[0, 1, 2].map(i => (
                                <input
                                    key={i}
                                    type="number"
                                    value={bezierPoints[key][i]}
                                    onChange={(e) => {
                                        const next = { ...bezierPoints };
                                        const values = [...next[key]] as [number, number, number];
                                        values[i] = parseFloat(e.target.value) || 0;
                                        next[key] = values;
                                        setBezierPoints(next);
                                    }}
                                    className="w-full bg-surface border border-border rounded px-2 py-1 text-xs"
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {type === 'plane' && (
                <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                        <label className="col-span-3 text-[10px] font-bold uppercase text-muted-foreground">Normal [x,y,z]</label>
                        {[0, 1, 2].map(i => (
                            <input
                                key={i}
                                type="number"
                                value={plane.normal[i]}
                                onChange={(e) => {
                                    const newNorm = [...plane.normal];
                                    newNorm[i] = parseFloat(e.target.value) || 0;
                                    setPlane({ ...plane, normal: newNorm });
                                }}
                                className="w-full bg-surface border border-border rounded px-2 py-1 text-xs"
                            />
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Const</label>
                            <input
                                type="number"
                                value={plane.constant}
                                onChange={(e) => setPlane({ ...plane, constant: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-surface border border-border rounded px-2 py-1 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">Size</label>
                            <input
                                type="number"
                                value={plane.size}
                                onChange={(e) => setPlane({ ...plane, size: parseFloat(e.target.value) || 1 })}
                                className="w-full bg-surface border border-border rounded px-2 py-1 text-xs"
                            />
                        </div>
                    </div>
                </div>
            )}

            {type === 'parametric' && (
                <div className="space-y-2">
                    {['X', 'Y', 'Z'].map(axis => (
                        <div key={axis} className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">{axis}(u, v)</label>
                            <input
                                type="text"
                                value={parametric[axis.toLowerCase() as 'x' | 'y' | 'z']}
                                onChange={(e) => setParametric({ ...parametric, [axis.toLowerCase()]: e.target.value })}
                                className="w-full bg-surface border border-border rounded px-2 py-1 text-xs font-mono"
                            />
                        </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">U Range</label>
                            <div className="flex gap-1">
                                <input type="number" value={parametric.uMin} onChange={(e) => setParametric({ ...parametric, uMin: parseFloat(e.target.value) })} className="w-full bg-surface border border-border rounded px-1 py-1 text-xs" />
                                <input type="number" value={parametric.uMax} onChange={(e) => setParametric({ ...parametric, uMax: parseFloat(e.target.value) })} className="w-full bg-surface border border-border rounded px-1 py-1 text-xs" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">V Range</label>
                            <div className="flex gap-1">
                                <input type="number" value={parametric.vMin} onChange={(e) => setParametric({ ...parametric, vMin: parseFloat(e.target.value) })} className="w-full bg-surface border border-border rounded px-1 py-1 text-xs" />
                                <input type="number" value={parametric.vMax} onChange={(e) => setParametric({ ...parametric, vMax: parseFloat(e.target.value) })} className="w-full bg-surface border border-border rounded px-1 py-1 text-xs" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={handleAdd}
                className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground py-2 rounded text-xs font-bold hover:brightness-110 transition-all shadow-lg"
            >
                <Plus size={14} />
                Add Entity
            </button>
        </div>
    );
};
