export interface Metrics {
    total_cars: number;
    avg_idle_seconds: number;
    total_co2_kg: number;
    trees_required: number;
    sustainability_score: number;
}

export interface TrendData {
    hour: string;
    total_cars: number;
    total_idle_seconds: number;
}
