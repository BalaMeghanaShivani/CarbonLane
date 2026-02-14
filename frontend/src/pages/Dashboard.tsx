import { useMemo } from 'react';
import { useCarbonLaneData } from '../hooks/useCarbonLaneData';
import CarEntriesTable from '../components/CarEntriesTable';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import MetricCard from '../components/MetricCard';
import SectionHeader from '../components/SectionHeader';
import SustainabilityGauge from '../components/SustainabilityGauge';
import { Car, Clock, Gauge, Leaf, TreeDeciduous, Droplets, Activity, MapPin } from 'lucide-react';

const Dashboard = () => {
    const { metrics, carEntries, loading, error, refetch } = useCarbonLaneData(5 * 60 * 1000);

    const derived = useMemo(() => {
        if (!metrics) return null;

        const peakHour = (metrics.peak_hour && metrics.peak_hour !== 'N/A') ? metrics.peak_hour : '—';
        const co2PerVehicle = metrics.co2_per_vehicle_kg ?? 0;
        const fuelWastedKg = (metrics.fuel_wasted_grams ?? 0) / 1000;

        const score = metrics.sustainability_score;
        const effLabel = score > 70 ? 'Good' : score >= 40 ? 'Moderate' : 'Poor';

        const co2Savings20 = (metrics.total_co2_kg ?? 0) * 0.2;
        const idleChange = metrics.trends?.idle?.value ?? 0;

        return { peakHour, co2PerVehicle, fuelWastedKg, effLabel, co2Savings20, idleChange };
    }, [metrics]);

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
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
                    <MetricCard title="Total Vehicles" value={(metrics?.total_cars ?? 0).toLocaleString()} icon={<Car className="h-4 w-4" />} />
                    <MetricCard title="Avg Idle Time" value={Number(metrics?.avg_idle_minutes ?? 0).toFixed(1)} unit="min" icon={<Clock className="h-4 w-4" />} />
                    <MetricCard title="Peak Hour" value={derived?.peakHour ?? '—'} icon={<Activity className="h-4 w-4" />} subtitle="1hr window with highest CO₂" />
                    <MetricCard title="Cars in Drive-Through" value={Number(metrics?.cars_in_drive_through ?? 0).toLocaleString()} icon={<MapPin className="h-4 w-4" />} subtitle="Currently waiting (no exit yet)" />
                </div>
            </section>

            {/* B — Environmental Impact */}
            <section>
                <SectionHeader title="Environmental Impact" subtitle="Carbon footprint and resource cost" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
                    <MetricCard title="Total CO₂" value={Number(metrics?.total_co2_kg ?? 0).toFixed(1)} unit="kg" icon={<Leaf className="h-4 w-4" />} />
                    <MetricCard title="CO₂ / Vehicle" value={Number(derived?.co2PerVehicle ?? 0).toFixed(3)} unit="kg" icon={<Gauge className="h-4 w-4" />} />
                    <MetricCard title="Trees Required" value={Number(metrics?.trees_required ?? 0).toFixed(1)} icon={<TreeDeciduous className="h-4 w-4" />} />
                    <MetricCard title="Fuel Wasted" value={Number(derived?.fuelWastedKg ?? 0).toFixed(1)} unit="kg" icon={<Droplets className="h-4 w-4" />} />
                </div>
            </section>

            {/* C — Efficiency Score */}
            <section>
                <SectionHeader title="Efficiency Score" />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <SustainabilityGauge score={metrics?.sustainability_score ?? 0} />
                    <CarEntriesTable entries={carEntries} />
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
