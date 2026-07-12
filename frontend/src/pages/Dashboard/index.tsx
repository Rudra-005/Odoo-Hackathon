import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Route, DollarSign, Activity } from 'lucide-react';
import DashboardService from '../../services/dashboard.service';
import { KPICard } from './components/KPICard';
import { RevenueChart } from './components/RevenueChart';

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: DashboardService.getSummary,
  });

  const { data: kpis, isLoading: isKpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: DashboardService.getKPIs,
  });

  const { data: charts, isLoading: isChartsLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: DashboardService.getCharts,
  });
  
  const { data: recent, isLoading: isRecentLoading } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: DashboardService.getRecent,
  });

  if (isSummaryLoading || isChartsLoading || isRecentLoading || isKpisLoading) {
    return <div className="flex h-96 items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back. Here's what's happening with your fleet today.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Active Vehicles" 
          value={`${summary?.active_vehicles || 0} / ${summary?.total_vehicles || 0}`}
          icon={Truck}
          colorClass="text-blue-500 bg-blue-50 dark:bg-blue-900/20"
          trend={{ value: summary?.utilization_rate ? Math.round(summary.utilization_rate) : 0, isPositive: true }}
          subtitle="utilization rate"
        />
        <KPICard 
          title="Active Trips" 
          value={summary?.active_trips || 0}
          icon={Route}
          colorClass="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
        />
        <KPICard 
          title="Today's Revenue" 
          value={`$${summary?.today_revenue?.toLocaleString() || 0}`}
          icon={DollarSign}
          colorClass="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
        />
        <KPICard 
          title="Today's Profit" 
          value={`$${summary?.today_profit?.toLocaleString() || 0}`}
          icon={Activity}
          colorClass={summary?.today_profit && summary.today_profit < 0 ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-green-500 bg-green-50 dark:bg-green-900/20"}
        />
      </div>

      {/* Scheduling & Fleet Status */}
      {kpis?.scheduling_kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trips Scheduled</p>
            <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">{kpis.scheduling_kpis.trips_today} Today</p>
            <p className="text-sm text-slate-500 mt-2">{kpis.scheduling_kpis.trips_this_week} this week</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fleet Activity</p>
            <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">
              {kpis.scheduling_kpis.vehicles_busy} Vehicles Busy
            </p>
            <p className="text-sm text-slate-500 mt-2">
              {kpis.scheduling_kpis.vehicles_available} available | {kpis.scheduling_kpis.maintenance_today} in shop
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Driver Status</p>
            <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">
              {kpis.scheduling_kpis.drivers_busy} On Trip
            </p>
            <p className="text-sm text-slate-500 mt-2">{kpis.scheduling_kpis.drivers_available} available</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Operations & Warnings</p>
            <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">
              Avg: {kpis.scheduling_kpis.avg_trip_duration.toFixed(1)} hrs
            </p>
            <p className="text-sm text-red-500 font-semibold mt-2">
              ⚠️ {kpis.scheduling_kpis.upcoming_license_expiry} License Expiries (30d)
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {charts?.revenue_expense_trend && (
            <RevenueChart data={charts.revenue_expense_trend} />
          )}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recent?.trips?.slice(0, 5).map(trip => (
              <div key={trip.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                <div>
                  <p className="text-sm font-semibold">{trip.number}</p>
                  <p className="text-xs text-slate-500">{trip.vehicle} - {trip.driver}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{trip.status}</span>
              </div>
            ))}
            {(!recent?.trips || recent.trips.length === 0) && (
              <p className="text-sm text-slate-500 text-center py-4">No recent trips.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
