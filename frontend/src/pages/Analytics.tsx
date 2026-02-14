import { useCarbonLaneData } from '../hooks/useCarbonLaneData';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import EmissionsTrendChart from '../components/EmissionsTrendChart';
import IdleDistributionChart from '../components/IdleDistributionChart';
import InsightPanel from '../components/InsightPanel';

const Analytics = () => {
    const { trends, emissionsTimeseries, idleDistribution, loading, error, refetch } = useCarbonLaneData();

    if (loading && trends.length === 0 && emissionsTimeseries.length === 0) return <Loader />;
    if (error) return <ErrorState message={error} onRetry={refetch} />;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-semibold text-white">Analytics</h1>
                <p className="mt-1 text-sm text-slate-400">Emission trends and idle-time analysis</p>
            </div>

            <EmissionsTrendChart data={emissionsTimeseries} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <IdleDistributionChart data={idleDistribution} />
                <InsightPanel trends={trends} />
            </div>
        </div>
    );
};

export default Analytics;
