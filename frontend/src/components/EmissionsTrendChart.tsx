import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { TrendData } from '../types';

interface Props {
    data: TrendData[];
}

const EmissionsTrendChart = ({ data }: Props) => (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-medium text-white">Hourly Carbon Emissions</h3>
        <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="gradCo2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="hour" stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="total_idle_seconds"
                        name="Idle Seconds"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#gradCo2)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export default EmissionsTrendChart;
