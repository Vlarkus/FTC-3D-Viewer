import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Eye, Hash, Maximize2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const RobotSettingsPanel: React.FC = () => {
    const { robotSettings, setRobotSettings } = useAppStore();

    const Toggle = ({
        label,
        value,
        onChange,
        icon: Icon
    }: {
        label: string;
        value: boolean;
        onChange: (v: boolean) => void;
        icon: any;
    }) => (
        <button
            onClick={() => onChange(!value)}
            className={cn(
                "w-full flex items-center justify-between p-2 rounded border transition-all text-xs",
                value
                    ? "bg-accent/10 border-accent/50 text-accent-foreground"
                    : "bg-surface/30 border-border/50 text-muted-foreground hover:border-border"
            )}
        >
            <div className="flex items-center gap-2">
                <Icon size={14} className={value ? "text-accent" : "text-muted-foreground"} />
                <span>{label}</span>
            </div>
            <div className={cn(
                "w-8 h-4 rounded-full relative transition-colors",
                value ? "bg-accent" : "bg-muted/30"
            )}>
                <div className={cn(
                    "absolute top-1 w-2 h-2 rounded-full bg-white transition-all",
                    value ? "left-5" : "left-1"
                )} />
            </div>
        </button>
    );

    return (
        <div className="space-y-2">
            <Toggle
                label="Show Robot Dot"
                value={robotSettings.showRobot}
                onChange={(v) => setRobotSettings({ showRobot: v })}
                icon={Eye}
            />
            <Toggle
                label="Show Coordinates"
                value={robotSettings.showCoordinates}
                onChange={(v) => setRobotSettings({ showCoordinates: v })}
                icon={Hash}
            />
            <Toggle
                label="Projection Lines"
                value={robotSettings.showProjections}
                onChange={(v) => setRobotSettings({ showProjections: v })}
                icon={Maximize2}
            />
        </div>
    );
};
