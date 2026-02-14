import { useEffect, useState, useCallback } from 'react';
import { fetchCarEntries, fetchEmissionsTimeseries, fetchIdleDistribution, fetchMetrics, fetchTrends } from '../api/client';
import type { CarEntryRow, EmissionsTimeseriesPoint, IdleDistributionPoint, Metrics, TrendData } from '../types';

interface UseCarbonLaneDataResult {
    metrics: Metrics | null;
    trends: TrendData[];
    emissionsTimeseries: EmissionsTimeseriesPoint[];
    idleDistribution: IdleDistributionPoint[];
    carEntries: CarEntryRow[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useCarbonLaneData(autoRefreshMs?: number): UseCarbonLaneDataResult {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [emissionsTimeseries, setEmissionsTimeseries] = useState<EmissionsTimeseriesPoint[]>([]);
    const [idleDistribution, setIdleDistribution] = useState<IdleDistributionPoint[]>([]);
    const [carEntries, setCarEntries] = useState<CarEntryRow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        try {
            setError(null);
            const [m, t, et, id, ce] = await Promise.all([fetchMetrics(), fetchTrends(), fetchEmissionsTimeseries(), fetchIdleDistribution(), fetchCarEntries(100)]);
            if (m && typeof m === 'object' && 'error' in m) {
                throw new Error((m as { error: string }).error);
            }
            if (!Array.isArray(t)) {
                setTrends([]);
            } else {
                setTrends(t);
            }
            setEmissionsTimeseries(Array.isArray(et) ? et : []);
            setIdleDistribution(Array.isArray(id) ? id : []);
            setCarEntries(Array.isArray(ce) ? ce : []);
            setMetrics(m && typeof m === 'object' ? m : null);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to fetch data. Check backend is running.');
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

    return { metrics, trends, emissionsTimeseries, idleDistribution, carEntries, loading, error, refetch };
}
