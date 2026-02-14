import axios from 'axios';
import { USE_MOCK } from '../config';
import type { CarEntryRow, EmissionsTimeseriesPoint, HotspotsData, IdleDistributionPoint, Metrics, TrendData } from '../types';
import mockMetrics from '../mock/metrics.json';
import mockTrends from '../mock/trends.json';

const apiClient = axios.create({
    baseURL: '/api',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Standard error handling logic can go here
        return Promise.reject(error);
    }
);

export const fetchMetrics = async (): Promise<Metrics> => {
    if (USE_MOCK) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockMetrics as Metrics;
    }
    const response = await apiClient.get<Metrics>('/metrics');
    return response.data;
};

export const simulateCarEnter = async (numberplate?: string): Promise<{ entry_id: number; numberplate: string; enter_timestamp: string }> => {
    const response = await apiClient.post('/car-entries/enter', numberplate ? { numberplate } : {});
    return response.data;
};

export const simulateCarExit = async (): Promise<{ entry_id: number; numberplate: string; enter_timestamp: string; exit_timestamp: string }> => {
    const response = await apiClient.post('/car-entries/exit');
    return response.data;
};

export const fetchPendingCars = async (): Promise<{ entry_id: number; numberplate: string; enter_timestamp: string }[]> => {
    const response = await apiClient.get('/car-entries/pending');
    return response.data;
};

export const fetchCarEntries = async (limit = 100): Promise<CarEntryRow[]> => {
    const response = await apiClient.get<CarEntryRow[]>('/car-entries', { params: { limit } });
    return response.data;
};

export const fetchHotspots = async (): Promise<HotspotsData> => {
    if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { grid: Array(7).fill(null).map(() => Array(24).fill(0)) };
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
    const response = await apiClient.get<HotspotsData>('/hotspots', { params: { tz } });
    return response.data;
};

export const fetchIdleDistribution = async (): Promise<IdleDistributionPoint[]> => {
    if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return [];
    }
    const response = await apiClient.get<IdleDistributionPoint[]>('/idle-distribution');
    return response.data;
};

export const fetchEmissionsTimeseries = async (): Promise<EmissionsTimeseriesPoint[]> => {
    if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return [];
    }
    const response = await apiClient.get<EmissionsTimeseriesPoint[]>('/emissions-timeseries');
    return response.data;
};

export const fetchTrends = async (): Promise<TrendData[]> => {
    if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockTrends as TrendData[];
    }
    const response = await apiClient.get<TrendData[]>('/trends');
    return response.data;
};

export default apiClient;
