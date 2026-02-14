import axios from 'axios';
import { USE_MOCK } from '../config';
import type { Metrics, TrendData } from '../types';
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

export const fetchTrends = async (): Promise<TrendData[]> => {
    if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockTrends as TrendData[];
    }
    const response = await apiClient.get<TrendData[]>('/trends');
    return response.data;
};

export default apiClient;
