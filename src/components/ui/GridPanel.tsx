import React from 'react';
import { useAppStore, type AxisSettings } from '../../store/useAppStore';

const NumberInput = ({ value, onChange, min, ...props }: { value: number, onChange: (val: number) => void, min?: number } & React.InputHTMLAttributes<HTMLInputElement>) => {
    const [localVal, setLocalVal] = React.useState(value.toString());

    React.useEffect(() => {
        setLocalVal(value.toString()); // Sync from parent
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalVal(val);

        const parsed = parseFloat(val);
        if (!isNaN(parsed)) {
            // Apply min constraint if defined
            if (min !== undefined && parsed < min) return;
            onChange(parsed);
        }
    };

    const handleBlur = () => {
        setLocalVal(value.toString()); // Reset to valid state
    };

    return (
        <input
            {...props}
            type="number" // basic HTML constraint
            className="w-full bg-background border border-border rounded px-1"
            value={localVal}
            onChange={handleChange}
            onBlur={handleBlur}
            step="any"
        />
    );
};

const AxisControl = ({ label, axis, settings, update }: { label: string, axis: 'x' | 'y' | 'z', settings: AxisSettings, update: any }) => {
    return (
        <div className="text-xs space-y-1 border-l-2 border-border pl-2 mb-2">
            <div className="font-bold text-muted-foreground">{label} AXIS</div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <span className="block text-[10px] text-muted-foreground">Range</span>
                    <div className="flex gap-1">
                        <NumberInput
                            value={settings.min}
                            onChange={(val) => update(axis, { min: val })}
                        />
                        <NumberInput
                            value={settings.max}
                            onChange={(val) => update(axis, { max: val })}
                        />
                    </div>
                </div>
                <div>
                    <span className="block text-[10px] text-muted-foreground">Size (Vis)</span>
                    <NumberInput
                        value={settings.size}
                        min={0.1} // Prevent zero or negative size
                        onChange={(val) => update(axis, { size: val })}
                    />
                </div>
                <div className="col-span-2">
                    <span className="block text-[10px] text-muted-foreground">Step</span>
                    <NumberInput
                        value={settings.step}
                        min={0}
                        onChange={(val) => update(axis, { step: val })}
                    />
                </div>
            </div>
        </div>
    );
};

export const GridPanel: React.FC = () => {
    const { axes, setAxisSettings, showGrid, setShowGrid } = useAppStore();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                />
                <span className="text-sm font-semibold">Enable Plot Box</span>
            </div>

            {showGrid && (
                <div className="space-y-4">
                    <AxisControl label="X Axis" axis="x" settings={axes.x} update={setAxisSettings} />
                    <AxisControl label="Y Axis (Depth)" axis="z" settings={axes.z} update={setAxisSettings} />
                    <AxisControl label="Z Axis (Height)" axis="y" settings={axes.y} update={setAxisSettings} />
                </div>
            )}
        </div>
    );
};
