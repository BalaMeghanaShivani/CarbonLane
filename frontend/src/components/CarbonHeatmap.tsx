import { useMemo } from 'react';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 24 }, (_, i) => i);

// Generate stable pseudo-random data seeded by day+hour
function intensity(day: number, hour: number): number {
    const isPeak = (hour >= 8 && hour <= 9) || (hour >= 17 && hour <= 18);
    const isWeekend = day >= 5;
    const seed = Math.sin(day * 24 + hour + 1) * 10000;
    let base = (seed - Math.floor(seed)) * 0.35;
    if (isPeak && !isWeekend) base += 0.55;
    if (isWeekend) base *= 0.5;
    return Math.min(1, base);
}

function cellColor(v: number): string {
    if (v < 0.3) return 'bg-emerald-900/50';
    if (v < 0.6) return 'bg-yellow-600/50';
    return 'bg-red-500/70';
}

const CarbonHeatmap = () => {
    const grid = useMemo(() =>
        days.map((_, di) => hours.map(h => intensity(di, h))),
        []
    );

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h3 className="mb-5 text-lg font-medium text-white">Carbon Hotspot Heatmap</h3>

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
                            {grid[di].map((v, hi) => {
                                const co2 = Math.round(v * 100);
                                return (
                                    <div
                                        key={hi}
                                        title={`${day} ${hi}:00 — ${co2} kg CO₂`}
                                        className={`h-5 w-full rounded-sm transition-transform hover:scale-125 cursor-pointer ${cellColor(v)}`}
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
