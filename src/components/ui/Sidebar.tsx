import { ConnectionPanel } from './ConnectionPanel';
import { GeometryExplorer } from './GeometryExplorer';
import { CameraPanel } from './CameraPanel';
import { GridPanel } from './GridPanel';
import { RobotSettingsPanel } from './RobotSettingsPanel';
import { useAppStore } from '../../store/useAppStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const Sidebar = () => {
    const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
    const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className={cn(
                "fixed inset-y-0 left-0 w-80 border-r border-border bg-surface flex flex-col z-50 shadow-xl transition-all duration-300 md:relative md:translate-x-0 overflow-hidden",
                !isSidebarOpen && "-translate-x-full md:w-0 md:border-r-0 md:translate-x-0"
            )}>
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            FTC 3D <span className="text-accent">Viewer</span>
                        </h1>
                        <p className="text-xs text-muted-foreground">Version 2.1.0</p>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-1 hover:bg-accent rounded-md md:hidden"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    <section>
                        <h2 className="text-xs font-bold text-muted-foreground uppercase mb-4">Connection</h2>
                        <ConnectionPanel />
                    </section>

                    <section>
                        <h2 className="text-xs font-bold text-muted-foreground uppercase mb-4">View Control</h2>
                        <CameraPanel />
                    </section>

                    <section>
                        <h2 className="text-xs font-bold text-muted-foreground uppercase mb-4">Plot Settings</h2>
                        <GridPanel />
                    </section>

                    <section>
                        <h2 className="text-xs font-bold text-muted-foreground uppercase mb-4">Robot Visuals</h2>
                        <RobotSettingsPanel />
                    </section>

                    <section>
                        <h2 className="text-xs font-bold text-muted-foreground uppercase mb-4">Geometry</h2>
                        <GeometryExplorer />
                    </section>
                </div>
            </div>
        </>
    );
};
