import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { TrendData } from '../types';

interface ChartProps {
    data: TrendData[];
}

export const CarsChart = ({ data }: ChartProps) => {
    return (
        <div className="h-[400px] w-full rounded-xl border border-gray-800 bg-card-bg p-6 shadow-lg">
            <h3 className="mb-6 text-xl font-semibold text-white">Traffic Volume (Cars/Hour)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="hour" stroke="#9ca3af" tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="total_cars"
                        name="Total Cars"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981' }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export const IdleChart = ({ data }: ChartProps) => {
    return (
        <div className="h-[400px] w-full rounded-xl border border-gray-800 bg-card-bg p-6 shadow-lg">
            <h3 className="mb-6 text-xl font-semibold text-white">Idle Time Analysis (Seconds)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="hour" stroke="#9ca3af" tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Bar
                        dataKey="total_idle_seconds"
                        name="Idle Seconds"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
