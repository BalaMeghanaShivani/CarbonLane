import { useCarbonLaneData } from '../hooks/useCarbonLaneData';
import DriveThroughSimulator from '../components/DriveThroughSimulator';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';

const Simulator = () => {
    const { loading, error, refetch } = useCarbonLaneData();

    if (loading) return <Loader />;
    if (error) return <ErrorState message={error} onRetry={refetch} />;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-semibold text-white">Simulator</h1>
                <p className="mt-1 text-sm text-slate-400">Simulate drive-through traffic</p>
            </div>

            <DriveThroughSimulator onUpdate={refetch} />
        </div>
    );
};

export default Simulator;
