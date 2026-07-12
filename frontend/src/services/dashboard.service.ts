import api from '../config/axios';

export interface DashboardSummary {
  total_vehicles: number;
  active_vehicles: number;
  utilization_rate: number;
  active_trips: number;
  today_revenue: number;
  today_expense: number;
  today_profit: number;
}

export interface DashboardKPIs {
  vehicle_status: Record<string, number>;
  driver_stats: {
    total: number;
    available: number;
    on_trip: number;
    suspended: number;
  };
  monthly_financials: {
    revenue: number;
    expense: number;
    profit: number;
    maintenance_cost: number;
    fuel_cost: number;
  };
  scheduling_kpis?: {
    trips_today: number;
    trips_this_week: number;
    vehicles_busy: number;
    drivers_busy: number;
    vehicles_available: number;
    drivers_available: number;
    maintenance_today: number;
    avg_trip_duration: number;
    avg_fuel_consumption: number;
    upcoming_license_expiry: number;
    upcoming_maintenance: number;
  };
}

export interface DashboardCharts {
  revenue_expense_trend: Array<{
    month: string;
    revenue: number;
    expense: number;
  }>;
}

export interface RecentActivity {
  trips: Array<{
    id: string;
    number: string;
    vehicle: string;
    driver: string;
    status: string;
    revenue: number;
  }>;
  expenses: Array<{
    id: string;
    number: string;
    category: string;
    vehicle: string;
    amount: number;
    status: string;
  }>;
}

class DashboardService {
  static async getSummary(): Promise<DashboardSummary> {
    const response = await api.get('/dashboard/summary/');
    return response.data;
  }

  static async getKPIs(): Promise<DashboardKPIs> {
    const response = await api.get('/dashboard/kpis/');
    return response.data;
  }

  static async getCharts(): Promise<DashboardCharts> {
    const response = await api.get('/dashboard/charts/');
    return response.data;
  }

  static async getRecent(): Promise<RecentActivity> {
    const response = await api.get('/dashboard/recent/');
    return response.data;
  }
}

export default DashboardService;
