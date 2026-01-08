import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { RobotConnectionService } from '../../services/RobotConnection';

export const ConnectionPanel: React.FC = () => {
    const {
        ipAddress,
        setIpAddress,
        connectionStatus
    } = useAppStore();

    // Singleton-ish usage for now, or we could move this to a Provider
    // Ideally we don't create a new service every render.
    // Let's assume we maintain a persistent instance or just handle it here for now.
    // Better pattern: store service instance in a hook or outside component.
    const [service] = useState(() => new RobotConnectionService(ipAddress));

    // Update service IP when input changes (simplified)
    useEffect(() => {
        // In a real app we'd have a setIp method on the service
    }, [ipAddress]);

    const handleConnect = () => {
        // Create a fresh service instance or reuse
        // For V2 MVP, let's just use the local instance
        // We need to pass the CURRENT ip
        const s = new RobotConnectionService(ipAddress);
        s.connect();
        // In a real implementation we would cleanup the old one
    };

    const handleDisconnect = () => {
        service.disconnect();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                <span className="font-semibold text-sm capitalize">{connectionStatus}</span>
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="Enter Robot Controller IP"
                    className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent placeholder:text-muted-foreground/50"
                />
                <button
                    onClick={handleConnect}
                    className="bg-accent text-accent-foreground p-2 rounded hover:brightness-110 transition-all"
                    title="Connect"
                >
                    <RefreshCw size={18} />
                </button>
                {connectionStatus === 'connected' && (
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
                Matches typical Connect Mode IP or localhost.
            </p>
        </div>
    );
}
