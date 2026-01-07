import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const PrimitivesEditor: React.FC = () => {
    const { segments, addSegment, removeSegment } = useAppStore();

    // Local state for new segment inputs
    const [startX, setStartX] = useState("0");
    const [startY, setStartY] = useState("0");
    const [startZ, setStartZ] = useState("0");
    const [endX, setEndX] = useState("1");
    const [endY, setEndY] = useState("1");
    const [endZ, setEndZ] = useState("1");

    const handleAdd = () => {
        addSegment({
            id: Math.random().toString(36).substr(2, 9),
            start: [parseFloat(startX), parseFloat(startY), parseFloat(startZ)],
            end: [parseFloat(endX), parseFloat(endY), parseFloat(endZ)],
            color: "#f0f" // Default magenta
        });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Segments</h3>

            {/* List */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
                {segments.map(seg => (
                    <div key={seg.id} className="flex items-center justify-between bg-background p-2 rounded text-xs">
                        <span>Line ({seg.color})</span>
                        <button onClick={() => removeSegment(seg.id)} className="text-destructive hover:text-destructive-foreground">
                            <X size={14} />
                        </button>
                    </div>
                ))}
                {segments.length === 0 && <span className="text-xs text-muted-foreground italic">No segments added</span>}
            </div>

            {/* Add New */}
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                    <label>Start</label>
                    <div className="flex gap-1">
                        <input className="w-full bg-background border border-border rounded px-1" value={startX} onChange={e => setStartX(e.target.value)} placeholder="X" />
                        <input className="w-full bg-background border border-border rounded px-1" value={startY} onChange={e => setStartY(e.target.value)} placeholder="Y" />
                        <input className="w-full bg-background border border-border rounded px-1" value={startZ} onChange={e => setStartZ(e.target.value)} placeholder="Z" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label>End</label>
                    <div className="flex gap-1">
                        <input className="w-full bg-background border border-border rounded px-1" value={endX} onChange={e => setEndX(e.target.value)} placeholder="X" />
                        <input className="w-full bg-background border border-border rounded px-1" value={endY} onChange={e => setEndY(e.target.value)} placeholder="Y" />
                        <input className="w-full bg-background border border-border rounded px-1" value={endZ} onChange={e => setEndZ(e.target.value)} placeholder="Z" />
                    </div>
                </div>
            </div>

            <button onClick={handleAdd} className="w-full flex items-center justify-center gap-2 bg-surface-highlight hover:bg-border text-foreground py-2 rounded text-xs transition-colors">
                <Plus size={14} /> Add Segment
            </button>
        </div>
    );
};
