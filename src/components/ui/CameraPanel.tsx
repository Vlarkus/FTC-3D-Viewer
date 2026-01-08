import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { MousePointer2, Orbit } from 'lucide-react';

export const CameraPanel: React.FC = () => {
    const { cameraMode, setCameraMode, orbitTarget, setOrbitTarget, cameraSpeed, setCameraSpeed } = useAppStore();
    const [isTouch, setIsTouch] = React.useState(false);
    const [warning, setWarning] = React.useState('');

    React.useEffect(() => {
        // Simple touch detection
        const checkTouch = () => {
            // Coarse pointer usually means touch
            if (window.matchMedia("(pointer: coarse)").matches) {
                setIsTouch(true);
                if (cameraMode === 'free') {
                    setCameraMode('orbit'); // Enforce orbit if somehow in free
                    setWarning('Free camera disabled on touch devices');
                    setTimeout(() => setWarning(''), 3000);
                }
            }
        };
        checkTouch();
    }, [cameraMode]); // Re-check if mode changes, ensuring enforcement

    const handleFreeModeClick = () => {
        if (isTouch) {
            setWarning('Free camera requires mouse/keyboard');
            setTimeout(() => setWarning(''), 3000);
            return;
        }
        setCameraMode('free');
    };

    return (
        <div className="space-y-4">
            {/* Mode Selection */}
            <div className="flex bg-background border border-border rounded p-1">
                <button
                    onClick={() => setCameraMode('orbit')}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs rounded transition-colors ${cameraMode === 'orbit' ? 'bg-surface-highlight text-white' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Orbit size={14} /> Orbit
                </button>
                <button
                    onClick={handleFreeModeClick}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs rounded transition-colors ${cameraMode === 'free' ? 'bg-surface-highlight text-white' :
                        isTouch ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <MousePointer2 size={14} /> Free
                </button>
            </div>

            {/* Warning Message */}
            {warning && (
                <div className="text-[10px] text-yellow-500 font-bold bg-yellow-500/10 p-2 rounded text-center">
                    {warning}
                </div>
            )}

            {/* Orbit Options */}
            {cameraMode === 'orbit' && (
                <div className="space-y-2">
                    <label className="text-xs text-muted-foreground uppercase font-bold">Target</label>
                    <div className="flex gap-2">
                        <label className="flex items-center gap-2 text-xs">
                            <input
                                type="radio"
                                name="target"
                                checked={orbitTarget === 'origin'}
                                onChange={() => setOrbitTarget('origin')}
                            />
                            Origin
                        </label>
                        <label className="flex items-center gap-2 text-xs">
                            <input
                                type="radio"
                                name="target"
                                checked={orbitTarget === 'robot'}
                                onChange={() => setOrbitTarget('robot')}
                            />
                            Robot
                        </label>
                    </div>
                </div>
            )}

            {cameraMode === 'free' && (
                <div className="space-y-2">
                    <div className="text-xs text-muted-foreground bg-surface-highlight p-2 rounded">
                        WASD to move<br />Shift/Space for down/up<br />Click canvas to look
                    </div>
                    <div>
                        <span className="block text-[10px] text-muted-foreground mb-1">Move Speed (units/sec)</span>
                        <input
                            className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                            type="number"
                            value={cameraSpeed}
                            onChange={(e) => setCameraSpeed(parseFloat(e.target.value))}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
