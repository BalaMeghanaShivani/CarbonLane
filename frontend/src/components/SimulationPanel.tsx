import { useState, useMemo } from 'react';
import { Calculator, ArrowRight } from 'lucide-react';
import type { Metrics } from '../types';

interface Props {
    metrics: Metrics | null;
}

const SimulationPanel = ({ metrics }: Props) => {
    const [reduction, setReduction] = useState(0);

    const result = useMemo(() => {
        if (!metrics) return null;
        const cars = metrics.total_cars;
        const co2PerSec = 0.006;
        const fuelPerSec = 0.02 / 60;

        const savedCo2 = reduction * cars * co2PerSec;
        const savedFuel = reduction * cars * fuelPerSec;
        const newCo2 = Math.max(0, metrics.total_co2_kg - savedCo2);
        const costSaved = savedFuel * 1.2;

        return { savedCo2, savedFuel, newCo2, costSaved };
    }, [metrics, reduction]);

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-indigo-500/20 p-2 text-indigo-400">
                    <Calculator className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-lg font-medium text-white">Impact Simulator</h3>
                    <p className="text-sm text-slate-400">Slide to explore idle-time reduction scenarios.</p>
                </div>
            </div>

            {/* Slider */}
            <div className="mb-8">
                <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-300">Reduce idle time per car</span>
                    <span className="font-medium text-emerald-400">{reduction}s</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={60}
                    value={reduction}
                    onChange={e => setReduction(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                />
                <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>0 s</span><span>60 s</span>
                </div>
            </div>

            {/* Comparison grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <CompareCard label="Current CO₂" value={`${(metrics?.total_co2_kg ?? 0).toFixed(1)} kg`} variant="current" />
                <CompareCard label="Optimized CO₂" value={`${(result?.newCo2 ?? 0).toFixed(1)} kg`} variant="optimized" />
                <CompareCard label="Fuel Saved" value={`${(result?.savedFuel ?? 0).toFixed(1)} L`} variant="optimized" />
                <CompareCard label="Cost Saved" value={`$${(result?.costSaved ?? 0).toFixed(2)}`} variant="optimized" />
            </div>

            {/* Hero savings */}
            {reduction > 0 && result && (
                <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <ArrowRight className="h-5 w-5 text-emerald-400" />
                    <span className="text-lg font-bold text-emerald-400">
                        Estimated CO₂ Saved: {result.savedCo2.toFixed(1)} kg
                    </span>
                </div>
            )}
        </div>
    );
};

function CompareCard({ label, value, variant }: { label: string; value: string; variant: 'current' | 'optimized' }) {
    return (
        <div className="rounded-xl border border-slate-700/50 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${variant === 'optimized' ? 'text-emerald-400' : 'text-white'}`}>
                {value}
            </p>
        </div>
    );
}

export default SimulationPanel;
