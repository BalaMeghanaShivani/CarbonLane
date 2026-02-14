import { useEffect, useState } from 'react';
import { fetchTrends } from '../api/client';
import type { TrendData } from '../types';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import { CarsChart, IdleChart } from '../components/EmissionsChart';

const Trends = () => {
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getTrends = async () => {
            try {
                setLoading(true);
                const data = await fetchTrends();
                setTrends(data);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch trend data.');
            } finally {
                setLoading(false);
            }
        };

        getTrends();
    }, []);

    if (loading) return <Loader />;
    if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Historical Trends</h1>
                <p className="mt-2 text-gray-400">Visualize traffic and emissions data over time.</p>
            </div>

            <CarsChart data={trends} />
            <IdleChart data={trends} />
        </div>
    );
};

export default Trends;
