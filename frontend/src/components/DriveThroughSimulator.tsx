import { useCallback, useEffect, useState } from 'react';
import { Car, LogIn, LogOut } from 'lucide-react';
import { fetchPendingCars, simulateCarEnter, simulateCarExit } from '../api/client';

interface PendingCar {
    entry_id: number;
    numberplate: string;
    enter_timestamp: string;
}

const DriveThroughSimulator = ({ onUpdate }: { onUpdate?: () => void }) => {
    const [pending, setPending] = useState<PendingCar[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastAction, setLastAction] = useState<string | null>(null);

    const loadPending = useCallback(async () => {
        try {
            const cars = await fetchPendingCars();
            setPending(Array.isArray(cars) ? cars : []);
        } catch {
            setPending([]);
        }
    }, []);

    useEffect(() => {
        loadPending();
    }, [loadPending]);

    const handleEnter = async () => {
        setLoading(true);
        setError(null);
        setLastAction(null);
        try {
            await simulateCarEnter();
            await loadPending();
            setLastAction('Car entered drive-through');
            onUpdate?.();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            setError(axiosErr?.response?.data?.error ?? 'Failed to add car');
        } finally {
            setLoading(false);
        }
    };

    const handleExit = async () => {
        setLoading(true);
        setError(null);
        setLastAction(null);
        try {
            const result = await simulateCarExit();
            await loadPending();
            setLastAction(`${result.numberplate} exited (${formatDuration(result.enter_timestamp, result.exit_timestamp)})`);
            onUpdate?.();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
            const msg = axiosErr?.response?.data?.error ?? 'Failed to exit car';
            const status = axiosErr?.response?.status;
            setError(status === 400 ? 'No car in drive-through' : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
                    <Car className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-lg font-medium text-white">Drive-Through Simulation</h3>
                    <p className="text-sm text-slate-400">Simulate cars entering and exiting. Camera at start and end records timestamps.</p>
                </div>
            </div>

            {error && <p className="mb-4 text-sm text-amber-400">{error}</p>}
            {lastAction && <p className="mb-4 text-sm text-emerald-400">{lastAction}</p>}

            <div className="mb-6 flex flex-wrap gap-4">
                <button
                    onClick={handleEnter}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50"
                >
                    <LogIn className="h-4 w-4" />
                    Car enters
                </button>
                <button
                    onClick={handleExit}
                    disabled={loading || pending.length === 0}
                    className="flex items-center gap-2 rounded-lg bg-slate-600 px-4 py-2.5 font-medium text-white transition hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <LogOut className="h-4 w-4" />
                    Car exits
                </button>
            </div>

            <div>
                <h4 className="mb-2 text-sm font-medium text-slate-400">Cars in drive-through ({pending.length})</h4>
                {pending.length === 0 ? (
                    <p className="text-sm text-slate-500">No cars. Click &quot;Car enters&quot; to simulate.</p>
                ) : (
                    <ul className="space-y-2">
                        {pending.map((c) => (
                            <li key={c.entry_id} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 text-sm">
                                <span className="font-mono text-white">{c.numberplate}</span>
                                <span className="text-slate-500">since {formatTime(c.enter_timestamp)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

function formatTime(ts: string): string {
    try {
        const d = new Date(ts);
        return d.toLocaleTimeString();
    } catch {
        return ts;
    }
}

function formatDuration(enter: string, exit: string): string {
    try {
        const a = new Date(enter).getTime();
        const b = new Date(exit).getTime();
        const mins = Math.round((b - a) / 60000);
        return `${mins} min`;
    } catch {
        return '—';
    }
}

export default DriveThroughSimulator;
