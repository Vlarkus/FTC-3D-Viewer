import { useEffect } from 'react';
import { Sidebar } from './components/ui/Sidebar';
import { SidebarToggle } from './components/ui/SidebarToggle';
import { Scene } from './components/canvas/Scene';
import './services/GeometryAPI'; // Initialize global API
import { useAppStore } from './store/useAppStore';
import { geometryConfig } from './geometry.config';
import { HudOverlay } from './components/ui/HudOverlay';

function App() {
    // Load geometry configuration on mount
    useEffect(() => {
        useAppStore.getState().loadGeometryConfig(geometryConfig);
    }, []);

    return (
        <div className="w-screen h-screen bg-background text-foreground flex overflow-hidden relative">
            <SidebarToggle />
            <Sidebar />
            <div className="flex-1 relative bg-black h-full overflow-hidden">
                <HudOverlay />
                <Scene />
            </div>
        </div>
    );
}

export default App;
