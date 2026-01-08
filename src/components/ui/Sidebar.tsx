import { ConnectionPanel } from './ConnectionPanel';
import { GeometryExplorer } from './GeometryExplorer';
import { CameraPanel } from './CameraPanel';
import { GridPanel } from './GridPanel';

export const Sidebar = () => {
    return (
        <div className="w-80 border-r border-border bg-surface flex flex-col z-10 shadow-xl">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                    FTC 3D <span className="text-accent">Viewer</span>
                </h1>
                <p className="text-xs text-muted-foreground">Version 2.1.0</p>
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
                    <h2 className="text-xs font-bold text-muted-foreground uppercase mb-4">Geometry</h2>
                    <GeometryExplorer />
                </section>
            </div>
        </div>
    );
};
