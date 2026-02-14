import { Lightbulb } from 'lucide-react';
import type { TrendData } from '../types';

interface InsightPanelProps {
    trends: TrendData[];
}

const InsightPanel = ({ trends }: InsightPanelProps) => {
    if (trends.length === 0) return null;

    const peakEntry = trends.reduce((max, t) => (t.total_idle_seconds > max.total_idle_seconds ? t : max), trends[0]);
    const lowestEntry = trends.reduce((min, t) => (t.total_idle_seconds < min.total_idle_seconds ? t : min), trends[0]);
    const highIdleCount = trends.filter(t => t.total_idle_seconds > 4000).length;
    const highIdlePct = Math.round((highIdleCount / trends.length) * 100);

    const toHourRange = (hourStr: string) => {
        const h = parseInt(hourStr.split(':')[0], 10);
        const nextH = (h + 1) % 24;
        return `${hourStr} – ${String(nextH).padStart(2, '0')}:00`;
    };

    const insights = [
        `Peak emissions window: ${toHourRange(peakEntry.hour)}`,
        `Lowest emissions window: ${toHourRange(lowestEntry.hour)}`,
        `${highIdlePct}% of monitored hours exceed high-idle threshold`,
    ];

    return (
        <div className="h-full rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                    <Lightbulb className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-medium text-white">Key Insights</h3>
            </div>
            <ul className="space-y-3">
                {insights.map((text, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-slate-300">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        {text}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default InsightPanel;
