import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

interface SustainabilityGaugeProps {
    score: number;
}

const SustainabilityGauge = ({ score }: SustainabilityGaugeProps) => {
    const clamped = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;

    const data = [
        { name: 'Score', value: clamped },
        { name: 'Remaining', value: 100 - clamped },
    ];

    const color = clamped > 70 ? '#10b981' : clamped >= 40 ? '#facc15' : '#ef4444';
    const label = clamped > 70 ? 'Good' : clamped >= 40 ? 'Moderate' : 'Poor';

    return (
        <div className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h3 className="text-lg font-medium text-white">Efficiency Score</h3>
            <div className="relative mt-2 h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell fill={color} />
                            <Cell fill="#1e293b" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
                    <span className="text-5xl font-bold" style={{ color }}>{clamped}</span>
                    <span className="text-sm text-slate-400">{label}</span>
                </div>
            </div>
        </div>
    );
};

export default SustainabilityGauge;
