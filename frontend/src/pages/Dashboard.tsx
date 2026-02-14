import { useMemo } from 'react';
import { useCarbonLaneData } from '../hooks/useCarbonLaneData';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import MetricCard from '../components/MetricCard';
import SectionHeader from '../components/SectionHeader';
import SustainabilityGauge from '../components/SustainabilityGauge';
import { Car, Clock, Gauge, Leaf, TreeDeciduous, Droplets, Activity, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
    const { metrics, trends, loading, error, refetch } = useCarbonLaneData(5000);

    const derived = useMemo(() => {
        if (!metrics) return null;

        // Peak hour (max idle seconds from trend data)
        const peakHour = trends.length > 0
            ? trends.reduce((max, t) => (t.total_idle_seconds > max.total_idle_seconds ? t : max), trends[0]).hour
            : 'N/A';

        // Congestion status
        const congestion = metrics.avg_idle_seconds < 60 ? 'Low' : metrics.avg_idle_seconds < 120 ? 'Moderate' : 'High';

        // CO₂ per vehicle
        const co2PerVehicle = metrics.total_cars > 0 ? (metrics.total_co2_kg / metrics.total_cars) : 0;

        // Fuel wasted
        const totalIdleMinutes = (metrics.avg_idle_seconds * metrics.total_cars) / 60;
        const fuelWasted = totalIdleMinutes * 0.02;

        // Efficiency label
        const score = metrics.sustainability_score;
        const effLabel = score > 70 ? 'Good' : score >= 40 ? 'Moderate' : 'Poor';

        // CO₂ savings at 20% idle reduction
        const co2Savings20 = metrics.total_co2_kg * 0.2;

        // Idle change vs 2 hours ago (mock)
        let idleChange = 0;
        if (trends.length >= 3) {
            const recent = trends[trends.length - 1].total_idle_seconds;
            const prev = trends[trends.length - 3].total_idle_seconds;
            idleChange = prev > 0 ? Math.round(((recent - prev) / prev) * 100) : 0;
        }

        return { peakHour, congestion, co2PerVehicle, fuelWasted, effLabel, co2Savings20, idleChange };
    }, [metrics, trends]);

    if (loading && !metrics) return <Loader />;
    if (error && !metrics) return <ErrorState message={error} onRetry={refetch} />;

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
                <p className="mt-1 text-sm text-slate-400">Real-time sustainability overview</p>
            </div>

            {/* A — Traffic Metrics */}
            <section>
                <SectionHeader title="Traffic Metrics" subtitle="Vehicle flow and congestion" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard title="Total Vehicles" value={metrics?.total_cars.toLocaleString() ?? '—'} icon={<Car className="h-4 w-4" />} trend={{ value: 12, isPositive: true }} />
                    <MetricCard title="Avg Idle Time" value={(metrics?.avg_idle_seconds ?? 0).toFixed(1)} unit="sec" icon={<Clock className="h-4 w-4" />} trend={{ value: 5, isPositive: false }} />
                    <MetricCard title="Peak Hour" value={`${derived?.peakHour ?? '—'}:00`} icon={<Activity className="h-4 w-4" />} subtitle="Highest idle window" />
                    <MetricCard title="Congestion" value={derived?.congestion ?? '—'} icon={<AlertTriangle className="h-4 w-4" />} subtitle="Based on avg idle" />
                </div>
            </section>

            {/* B — Environmental Impact */}
            <section>
                <SectionHeader title="Environmental Impact" subtitle="Carbon footprint and resource cost" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard title="Total CO₂" value={(metrics?.total_co2_kg ?? 0).toFixed(1)} unit="kg" icon={<Leaf className="h-4 w-4" />} trend={{ value: 8, isPositive: false }} />
                    <MetricCard title="CO₂ / Vehicle" value={(derived?.co2PerVehicle ?? 0).toFixed(3)} unit="kg" icon={<Gauge className="h-4 w-4" />} />
                    <MetricCard title="Trees Required" value={metrics?.trees_required ?? 0} icon={<TreeDeciduous className="h-4 w-4" />} />
                    <MetricCard title="Fuel Wasted" value={(derived?.fuelWasted ?? 0).toFixed(1)} unit="L" icon={<Droplets className="h-4 w-4" />} />
                </div>
            </section>

            {/* C — Efficiency Score */}
            <section>
                <SectionHeader title="Efficiency Score" />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <SustainabilityGauge score={metrics?.sustainability_score ?? 0} />

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                        <h3 className="text-lg font-medium text-white">
                            Efficiency: <span className={derived?.effLabel === 'Good' ? 'text-emerald-400' : derived?.effLabel === 'Moderate' ? 'text-yellow-400' : 'text-red-400'}>{derived?.effLabel}</span>
                        </h3>
                        <ul className="mt-4 space-y-3 text-sm text-slate-300">
                            <Bullet text={`Idle time changed ${derived?.idleChange ?? 0}% vs earlier window`} />
                            <Bullet text={`Top emission window: ${derived?.peakHour ?? '—'}:00 – ${derived?.peakHour ?? '—'}:59`} />
                            <Bullet text={`Potential CO₂ savings at −20% idle: ${(derived?.co2Savings20 ?? 0).toFixed(1)} kg`} />
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
};

function Bullet({ text }: { text: string }) {
    return (
        <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            {text}
        </li>
    );
}

export default Dashboard;
