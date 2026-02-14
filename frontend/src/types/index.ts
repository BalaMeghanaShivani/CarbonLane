export interface Metrics {
    total_cars: number;
    avg_idle_minutes: number;
    total_co2_kg: number;
    trees_required: number;
    sustainability_score: number;
    fuel_wasted_grams: number;
    co2_per_vehicle_kg: number;
    peak_hour: string;
    cars_in_drive_through: number;
    trends?: {
        vehicles: { value: number; isPositive: boolean };
        co2: { value: number; isPositive: boolean };
        idle: { value: number; isPositive: boolean };
    };
}

export interface TrendData {
    hour: string;
    total_cars: number;
    total_idle_seconds: number;
}

export interface EmissionsTimeseriesPoint {
    time: string;
    co2_kg: number;
}

export interface IdleDistributionPoint {
    range: string;
    count: number;
}

export interface HotspotsData {
    grid: number[][];  // 7 rows (Mon-Sun), 24 cols (hours)
}

export interface CarEntryRow {
    numberplate: string;
    enter_timestamp: string | null;
    exit_timestamp: string | null;
    minutes_elapsed: number | null;
    fuel_used: number | null;
    carbon_produced: number | null;
}
