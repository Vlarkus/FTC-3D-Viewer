import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Map, ArrowUp, ArrowDown } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { RobotConnectionService } from '../../services/RobotConnection';
import { MockRobotConnectionService } from '../../services/MockRobotConnection';
import { telemetryStore } from '../../store/telemetryStore';
import clsx from 'clsx';

export const ConnectionPanel: React.FC = () => {
    const {
        ipAddress,
        setIpAddress,
        connectionStatus,
        telemetryMapping,
        setTelemetryMapping
    } = useAppStore();

    const [service] = useState(() => new RobotConnectionService(ipAddress));
    const [mockService] = useState(() => new MockRobotConnectionService());
    const [isDemo, setIsDemo] = useState(false);

    // For mapping UI, we need to know available keys
    const [availableKeys, setAvailableKeys] = useState<string[]>([]);
    const [liveTelemetry, setLiveTelemetry] = useState<any>({});
    const { axes } = useAppStore();

    useEffect(() => {
        if (connectionStatus === 'connected' || isDemo) {
            const keys = Object.keys(telemetryStore.getState());
            setAvailableKeys(keys);

            // Subscribe to live telemetry for out-of-range feedback
            const unsubscribe = telemetryStore.subscribe(() => {
                setLiveTelemetry(telemetryStore.getState());
            });
            return () => { unsubscribe(); };
        }
    }, [connectionStatus, isDemo]);

    // Helper to check range direction
    const getRangeDirection = (key: string) => {
        const val = Number(liveTelemetry[key]);
        if (isNaN(val)) return null;

        if (telemetryMapping.x === key) {
            if (val > axes.x.max) return 'up';
            if (val < axes.x.min) return 'down';
        }
        // NOTE: In useCoordinateMapper.ts, Y logical maps to Z visual (axes.z)
        // and Z logical maps to Y visual (axes.y)
        if (telemetryMapping.y === key) {
            if (val > axes.z.max) return 'up';
            if (val < axes.z.min) return 'down';
        }
        if (telemetryMapping.z === key) {
            if (val > axes.y.max) return 'up';
            if (val < axes.y.min) return 'down';
        }
        return null;
    };

    const handleConnect = () => {
        if (ipAddress.toLowerCase().trim() === 'demo') {
            handleDemo();
            return;
        }

        if (isDemo) {
            mockService.disconnect();
            setIsDemo(false);
        }
        const s = new RobotConnectionService(ipAddress);
        s.connect();
    };

    const handleDemo = () => {
        if (connectionStatus === 'connected' && !isDemo) {
            service.disconnect();
        }
        mockService.connect();
        setIsDemo(true);
    };

    const handleDisconnect = () => {
        if (isDemo) {
            mockService.disconnect();
            setIsDemo(false);
        } else {
            service.disconnect();
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className={clsx("w-2 h-2 rounded-full", {
                        'bg-green-500': connectionStatus === 'connected',
                        'bg-yellow-500': connectionStatus === 'connecting',
                        'bg-red-500': connectionStatus === 'disconnected' || connectionStatus === 'error'
                    })} />
                    <span className="font-semibold text-sm capitalize">
                        {isDemo ? 'Demo Mode' : connectionStatus}
                    </span>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={ipAddress}
                        onChange={(e) => setIpAddress(e.target.value)}
                        placeholder="Enter IP or 'demo'"
                        className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent placeholder:text-muted-foreground/50"
                    />
                    <button
                        onClick={handleConnect}
                        className="bg-accent text-accent-foreground p-2 rounded hover:brightness-110 transition-all"
                        title="Connect"
                    >
                        <RefreshCw size={18} />
                    </button>
                    {(connectionStatus === 'connected' || isDemo) && (
                        <button
                            onClick={handleDisconnect}
                            className="bg-destructive text-destructive-foreground p-2 rounded hover:brightness-110 transition-all"
                            title="Disconnect"
                        >
                            <WifiOff size={18} />
                        </button>
                    )}
                </div>

                <p className="text-xs text-muted-foreground">
                    Connect to a local robot or type <code className="text-accent-foreground px-1 bg-secondary rounded">demo</code> to simulate data.
                </p>
            </div>

            {/* Telemetry Mapping UI */}
            {(connectionStatus === 'connected' || isDemo) && (
                <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <div className="flex items-center gap-2">
                            <Map size={14} />
                            <span className="text-xs font-bold uppercase">Coordinate Mapping</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 ring-1 ring-border/50 rounded p-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {/* Reset / 0 Row */}
                        <div className="flex items-center gap-2 p-2 rounded bg-accent/10 border border-accent/20 text-xs shadow-sm">
                            <div className="flex gap-1">
                                {(['x', 'y', 'z'] as const).map(axis => (
                                    <button
                                        key={axis}
                                        onClick={() => setTelemetryMapping(axis, undefined)}
                                        className={clsx(
                                            "w-6 h-6 rounded flex items-center justify-center font-bold uppercase transition-all border shadow-sm",
                                            telemetryMapping[axis] === undefined
                                                ? "bg-accent text-accent-foreground border-accent"
                                                : "bg-surface text-muted-foreground hover:text-white border-border"
                                        )}
                                        title={`Set ${axis.toUpperCase()} to 0`}
                                    >
                                        {axis}
                                    </button>
                                ))}
                            </div>
                            <div className="w-6" /> {/* Spacer for arrow alignment */}
                            <span className="font-bold text-accent italic">None</span>
                        </div>

                        {/* Telemetry Keys */}
                        {availableKeys.map(key => {
                            const direction = getRangeDirection(key);
                            return (
                                <div
                                    key={key}
                                    className={clsx(
                                        "flex items-center gap-2 p-2 rounded border text-xs transition-colors",
                                        direction
                                            ? "bg-red-500/20 border-red-500/50 text-red-200"
                                            : "bg-surface/30 border-border/50"
                                    )}
                                >
                                    <div className="flex gap-1">
                                        {(['x', 'y', 'z'] as const).map(axis => (
                                            <button
                                                key={axis}
                                                onClick={() => setTelemetryMapping(axis, telemetryMapping[axis] === key ? undefined : key)}
                                                className={clsx(
                                                    "w-6 h-6 rounded flex items-center justify-center font-bold uppercase transition-all border shadow-sm",
                                                    telemetryMapping[axis] === key
                                                        ? "bg-accent text-accent-foreground border-accent"
                                                        : "bg-background/50 text-muted-foreground hover:text-white border-border"
                                                )}
                                                title={`Map to ${axis.toUpperCase()} `}
                                            >
                                                {axis}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Range Indicator Container */}
                                    <div className="w-6 flex justify-center shrink-0">
                                        {direction === 'up' && <ArrowUp size={14} className="text-red-500" />}
                                        {direction === 'down' && <ArrowDown size={14} className="text-red-500" />}
                                    </div>

                                    <span className={clsx(
                                        "font-mono truncate flex-1",
                                        direction ? "text-red-300 font-bold" : "text-muted-foreground"
                                    )}>
                                        {key}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    {availableKeys.length === 0 && (
                        <p className="text-xs text-muted-foreground italic text-center py-2">
                            Waiting for telemetry data...
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
