import { useCallback, useEffect, useState } from 'react';
import { fetchHotspots } from '../api/client';
import Loader from './Loader';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 24 }, (_, i) => i);

function cellColor(intensity: number): string {
    if (intensity < 0.3) return 'bg-emerald-900/50';
    if (intensity < 0.6) return 'bg-yellow-600/50';
    return 'bg-red-500/70';
}

const CarbonHeatmap = () => {
    const [grid, setGrid] = useState<number[][] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadHotspots = useCallback(() => {
        fetchHotspots()
            .then(({ grid: g }) => {
                if (g && g.length === 7 && g.every(row => row.length === 24)) {
                    setGrid(g);
                } else {
                    setGrid(Array(7).fill(null).map(() => Array(24).fill(0)));
                }
                setError(null);
            })
            .catch((err) => {
                console.error(err);
                setError('Failed to load hotspots');
                setGrid(Array(7).fill(null).map(() => Array(24).fill(0)));
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadHotspots();
        const id = setInterval(loadHotspots, 5 * 60 * 1000);
        return () => clearInterval(id);
    }, [loadHotspots]);

    const maxCo2 = grid ? Math.max(...grid.flat(), 0.001) : 1;
    const intensityGrid = grid
        ? grid.map(row => row.map(co2 => co2 / maxCo2))
        : [];

    const now = new Date();
    const currentDay = (now.getDay() + 6) % 7;
    const currentHour = now.getHours();

    if (loading && !grid) return <Loader />;

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h3 className="mb-5 text-lg font-medium text-white">Carbon Hotspot Heatmap</h3>
            {error && <p className="mb-4 text-sm text-amber-400">{error}</p>}

            {/* Hour labels */}
            <div className="mb-1 flex gap-1 pl-10 text-[10px] text-slate-500">
                {hours.filter(h => h % 3 === 0).map(h => (
                    <div key={h} className="flex-1 text-center">{h}:00</div>
                ))}
            </div>

            {/* Grid rows */}
            <div className="flex flex-col gap-1">
                {days.map((day, di) => (
                    <div key={day} className="flex items-center gap-1">
                        <span className="w-9 shrink-0 text-xs font-medium text-slate-400">{day}</span>
                        <div className="grid flex-1 grid-cols-24 gap-[3px]">
                            {(intensityGrid[di] ?? Array(24).fill(0)).map((intensity, hi) => {
                                const co2Kg = grid?.[di]?.[hi] ?? 0;
                                const isCurrent = di === currentDay && hi === currentHour;
                                return (
                                    <div
                                        key={hi}
                                        title={`${day} ${hi}:00 — ${co2Kg.toFixed(2)} kg CO₂${isCurrent ? ' (now)' : ''}`}
                                        className={`h-5 w-full rounded-sm transition-transform hover:scale-125 cursor-pointer ${cellColor(intensity)} ${isCurrent ? 'ring-2 ring-white' : ''}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-5 flex items-center justify-end gap-5 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-emerald-900/50" />Low</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-yellow-600/50" />Medium</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-red-500/70" />High</span>
            </div>
        </div>
    );
};

export default CarbonHeatmap;
