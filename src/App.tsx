import { useEffect } from 'react';
import { Sidebar } from './components/ui/Sidebar';
import { Scene } from './components/canvas/Scene';
import './services/GeometryAPI'; // Initialize global API
import { useAppStore } from './store/useAppStore';
import { geometryConfig } from './geometry.config';

function App() {
    // Load geometry configuration on mount
    useEffect(() => {
        useAppStore.getState().loadGeometryConfig(geometryConfig);
    }, []);

    return (
        <div className="w-screen h-screen bg-background text-foreground flex overflow-hidden">
            <Sidebar />
            <div className="flex-1 relative bg-black">
                <Scene />
            </div>
        </div>
    );
}

export default App;
