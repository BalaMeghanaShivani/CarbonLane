import { useEffect, useState, useCallback } from 'react';
import { fetchMetrics, fetchTrends } from '../api/client';
import type { Metrics, TrendData } from '../types';

interface UseCarbonLaneDataResult {
    metrics: Metrics | null;
    trends: TrendData[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useCarbonLaneData(autoRefreshMs?: number): UseCarbonLaneDataResult {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        try {
            setError(null);
            const [m, t] = await Promise.all([fetchMetrics(), fetchTrends()]);
            setMetrics(m);
            setTrends(t);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch data. Check backend or mock config.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
        if (autoRefreshMs && autoRefreshMs > 0) {
            const id = setInterval(refetch, autoRefreshMs);
            return () => clearInterval(id);
        }
    }, [refetch, autoRefreshMs]);

    return { metrics, trends, loading, error, refetch };
}
