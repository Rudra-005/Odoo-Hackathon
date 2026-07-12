import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileBarChart, Download, Filter, FileText, FileSpreadsheet, File } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import ReportService from '../../services/report.service';
import { KPICard } from '../Dashboard/components/KPICard';
import { DataTable } from '../../components/ui/DataTable';
import toast from 'react-hot-toast';
import { ColumnDef } from '@tanstack/react-table';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'fleet' | 'financial' | 'trips'>('financial');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['report', activeTab, dateRange],
    queryFn: () => {
      const filters = { start_date: dateRange.start, end_date: dateRange.end };
      if (activeTab === 'fleet') return ReportService.getFleetReport(filters);
      if (activeTab === 'financial') return ReportService.getFinancialReport(filters);
      if (activeTab === 'trips') return ReportService.getTripReport(filters);
    },
  });

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setIsExporting(true);
    const toastId = toast.loading(`Generating ${format.toUpperCase()} report...`);
    try {
      await ReportService.exportReport(activeTab, format, { start_date: dateRange.start, end_date: dateRange.end });
      toast.success('Download complete!', { id: toastId });
    } catch (error) {
      toast.error('Export failed', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const financialColumns: ColumnDef<any>[] = [
    { accessorKey: 'expense_number', header: 'Expense ID' },
    { accessorKey: 'expense_date', header: 'Date' },
    { accessorKey: 'category__name', header: 'Category' },
    { accessorKey: 'net_amount', header: 'Amount', cell: ({row}) => `$${row.original.net_amount}` },
    { accessorKey: 'status', header: 'Status' }
  ];

  const fleetColumns: ColumnDef<any>[] = [
    { accessorKey: 'registration_number', header: 'Reg No' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'vehicle_type', header: 'Type' },
    { accessorKey: 'current_odometer', header: 'Odometer', cell: ({row}) => `${row.original.current_odometer} km` },
    { accessorKey: 'total_trips', header: 'Total Trips' }
  ];

  const tripColumns: ColumnDef<any>[] = [
    { accessorKey: 'trip_number', header: 'Trip ID' },
    { accessorKey: 'vehicle__registration_number', header: 'Vehicle' },
    { accessorKey: 'driver__first_name', header: 'Driver', cell: ({row}) => `${row.original.driver__first_name} ${row.original.driver__last_name}` },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'revenue', header: 'Revenue', cell: ({row}) => `$${row.original.revenue}` },
    { accessorKey: 'actual_distance', header: 'Distance', cell: ({row}) => `${row.original.actual_distance || 0} km` }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-primary-500" />
            Business Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Generate, analyze, and export enterprise reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => handleExport('csv')} disabled={isExporting}>
            <FileText className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button variant="secondary" onClick={() => handleExport('excel')} disabled={isExporting}>
            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Excel
          </Button>
          <Button variant="primary" onClick={() => handleExport('pdf')} disabled={isExporting}>
            <File className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-sm font-medium text-slate-500 mb-1 block">Start Date</label>
          <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-500 mb-1 block">End Date</label>
          <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
        </div>
        <Button variant="secondary" onClick={() => setDateRange({start: '', end: ''})}>
          Clear Filters
        </Button>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {['financial', 'fleet', 'trips'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize
                ${activeTab === tab 
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400'}
              `}
            >
              {tab} Report
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">Loading Report Data...</div>
      ) : activeTab === 'financial' && data?.summary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KPICard title="Total Revenue" value={`$${data.summary.total_revenue}`} icon={FileBarChart} />
            <KPICard title="Total Expenses" value={`$${data.summary.total_expense}`} icon={FileBarChart} />
            <KPICard title="Net Profit" value={`$${data.summary.net_profit}`} icon={FileBarChart} />
            <KPICard title="Fleet ROI" value={`${data.summary.roi.toFixed(2)}%`} icon={FileBarChart} />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-semibold">Expense Breakdown</div>
            <DataTable columns={financialColumns} data={data.data || []} />
          </div>
        </div>
      ) : activeTab === 'fleet' && data?.summary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KPICard title="Total Vehicles" value={data.summary.total_vehicles} icon={FileBarChart} />
            <KPICard title="Active Vehicles" value={data.summary.active_vehicles} icon={FileBarChart} />
            <KPICard title="Utilization Rate" value={`${data.summary.utilization_rate.toFixed(1)}%`} icon={FileBarChart} />
            <KPICard title="Avg Odometer" value={`${data.summary.average_odometer.toFixed(0)} km`} icon={FileBarChart} />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-semibold">Fleet Status</div>
            <DataTable columns={fleetColumns} data={data.data || []} />
          </div>
        </div>
      ) : activeTab === 'trips' && data?.summary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KPICard title="Total Trips" value={data.summary.total_trips} icon={FileBarChart} />
            <KPICard title="Completed Trips" value={data.summary.completed_trips} icon={FileBarChart} />
            <KPICard title="Total Distance" value={`${data.summary.total_distance.toFixed(0)} km`} icon={FileBarChart} />
            <KPICard title="Total Revenue" value={`$${data.summary.total_revenue}`} icon={FileBarChart} />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-semibold">Trips Breakdown</div>
            <DataTable columns={tripColumns} data={data.data || []} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
