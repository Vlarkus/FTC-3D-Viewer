import { Sidebar } from './components/ui/Sidebar';
import { Scene } from './components/canvas/Scene';
import './services/GeometryAPI'; // Initialize global API

function App() {
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
