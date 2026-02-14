import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const defaultData = [
    { range: '0–60s', count: 450 },
    { range: '60–120s', count: 320 },
    { range: '120–180s', count: 180 },
    { range: '180s+', count: 80 },
];

const COLORS = ['#10b981', '#34d399', '#facc15', '#f87171'];

interface Props {
    data?: { range: string; count: number }[];
}

const IdleDistributionChart = ({ data }: Props) => {
    const chartData = data || defaultData;

    return (
        <div className="h-full rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-medium text-white">Idle Time Distribution</h3>
            <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="range" stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {chartData.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default IdleDistributionChart;
