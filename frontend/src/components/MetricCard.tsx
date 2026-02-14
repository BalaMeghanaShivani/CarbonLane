import type { ReactNode } from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    unit?: string;
    icon?: ReactNode;
    trend?: { value: number; isPositive: boolean };
    subtitle?: string;
}

const MetricCard = ({ title, value, unit, icon, trend, subtitle }: MetricCardProps) => {
    return (
        <div className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg transition hover:shadow-emerald-500/10">
            <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-400">{title}</p>
                {icon && (
                    <div className="rounded-lg bg-slate-800 p-2 text-emerald-400 transition group-hover:bg-emerald-500/20">
                        {icon}
                    </div>
                )}
            </div>

            <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-white">{value}</span>
                {unit && <span className="text-sm text-slate-500">{unit}</span>}
            </div>

            {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}

            {trend && (
                <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trend.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                    <span>{trend.isPositive ? '↑' : '↓'}</span>
                    <span>{Math.abs(trend.value)}%</span>
                    <span className="text-slate-500">vs last hr</span>
                </div>
            )}
        </div>
    );
};

export default MetricCard;
