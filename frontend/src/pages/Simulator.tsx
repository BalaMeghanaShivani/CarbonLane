import { useCarbonLaneData } from '../hooks/useCarbonLaneData';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import SimulationPanel from '../components/SimulationPanel';

const Simulator = () => {
    const { metrics, loading, error, refetch } = useCarbonLaneData();

    if (loading && !metrics) return <Loader />;
    if (error) return <ErrorState message={error} onRetry={refetch} />;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-semibold text-white">Impact Simulator</h1>
                <p className="mt-1 text-sm text-slate-400">Explore what-if scenarios by reducing idle time</p>
            </div>
            <SimulationPanel metrics={metrics} />
        </div>
    );
};

export default Simulator;
