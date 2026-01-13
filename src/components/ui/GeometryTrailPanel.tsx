import { Pause, Play, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../../store/useAppStore';
import { NumberField } from './NumberField';

export const GeometryTrailPanel = () => {
    const { trailSettings, setTrailSettings, clearTrail } = useAppStore();

    const isControllable = trailSettings.mode === 'controllable';

    const setMode = (mode: 'controllable' | 'temporary') => {
        setTrailSettings({ mode });
    };

    const setDisplay = (display: 'none' | 'points' | 'segments') => {
        setTrailSettings({ display });
    };

    return (
        <div className="space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase">Trail Options</div>

            <div className="space-y-2">
                <div className="text-[10px] text-muted-foreground uppercase">Mode</div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('controllable')}
                        className={clsx(
                            'flex-1 px-2 py-1 rounded border text-xs font-semibold transition-colors',
                            isControllable
                                ? 'bg-accent/10 border-accent/50 text-accent-foreground'
                                : 'bg-surface/30 border-border/50 text-muted-foreground hover:border-border'
                        )}
                    >
                        Controllable
                    </button>
                    <button
                        onClick={() => setMode('temporary')}
                        className={clsx(
                            'flex-1 px-2 py-1 rounded border text-xs font-semibold transition-colors',
                            !isControllable
                                ? 'bg-accent/10 border-accent/50 text-accent-foreground'
                                : 'bg-surface/30 border-border/50 text-muted-foreground hover:border-border'
                        )}
                    >
                        Temporary
                    </button>
                </div>
            </div>

            {isControllable ? (
                <div className="flex gap-2">
                    <button
                        onClick={() => setTrailSettings({ controllablePaused: !trailSettings.controllablePaused })}
                        className={clsx(
                            'flex-1 px-2 py-1 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2',
                            trailSettings.controllablePaused
                                ? 'bg-accent text-accent-foreground hover:brightness-110'
                                : 'bg-surface/40 text-muted-foreground hover:text-white border border-border'
                        )}
                    >
                        {trailSettings.controllablePaused ? <Play size={14} /> : <Pause size={14} />}
                        {trailSettings.controllablePaused ? 'Continue' : 'Stop'}
                    </button>
                    <button
                        onClick={clearTrail}
                        className="flex-1 px-2 py-1 rounded text-xs font-semibold transition-colors bg-destructive text-destructive-foreground hover:brightness-110 flex items-center justify-center gap-2"
                    >
                        <Trash2 size={14} />
                        Clear
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="text-[10px] text-muted-foreground uppercase">Length</div>
                    <div className="flex items-center gap-2">
                        <NumberField
                            value={trailSettings.tempLength}
                            onChange={(val) => setTrailSettings({ tempLength: Math.max(1, val) })}
                            min={1}
                            step={1}
                            className="w-24"
                        />
                        <div className="flex gap-1">
                            <button
                                onClick={() => setTrailSettings({ tempUnit: 'updates' })}
                                className={clsx(
                                    'px-2 py-1 rounded border text-[10px] font-bold uppercase transition-colors',
                                    trailSettings.tempUnit === 'updates'
                                        ? 'bg-accent/10 border-accent/50 text-accent-foreground'
                                        : 'bg-surface/30 border-border/50 text-muted-foreground hover:border-border'
                                )}
                            >
                                Updates
                            </button>
                            <button
                                onClick={() => setTrailSettings({ tempUnit: 'seconds' })}
                                className={clsx(
                                    'px-2 py-1 rounded border text-[10px] font-bold uppercase transition-colors',
                                    trailSettings.tempUnit === 'seconds'
                                        ? 'bg-accent/10 border-accent/50 text-accent-foreground'
                                        : 'bg-surface/30 border-border/50 text-muted-foreground hover:border-border'
                                )}
                            >
                                Seconds
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="text-[10px] text-muted-foreground uppercase">Display</div>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => setDisplay('none')}
                        className={clsx(
                            'px-2 py-1 rounded border text-xs font-semibold transition-colors',
                            trailSettings.display === 'none'
                                ? 'bg-accent/10 border-accent/50 text-accent-foreground'
                                : 'bg-surface/30 border-border/50 text-muted-foreground hover:border-border'
                        )}
                    >
                        None
                    </button>
                    <button
                        onClick={() => setDisplay('points')}
                        className={clsx(
                            'px-2 py-1 rounded border text-xs font-semibold transition-colors',
                            trailSettings.display === 'points'
                                ? 'bg-accent/10 border-accent/50 text-accent-foreground'
                                : 'bg-surface/30 border-border/50 text-muted-foreground hover:border-border'
                        )}
                    >
                        Points
                    </button>
                    <button
                        onClick={() => setDisplay('segments')}
                        className={clsx(
                            'px-2 py-1 rounded border text-xs font-semibold transition-colors',
                            trailSettings.display === 'segments'
                                ? 'bg-accent/10 border-accent/50 text-accent-foreground'
                                : 'bg-surface/30 border-border/50 text-muted-foreground hover:border-border'
                        )}
                    >
                        Segments
                    </button>
                </div>
            </div>
        </div>
    );
};
