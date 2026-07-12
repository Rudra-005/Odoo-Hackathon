import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit2, Trash2, Download, Fuel } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import FuelService from '../../services/fuel.service';
import { FuelLog } from '../../types/fuel';
import { ColumnDef } from '@tanstack/react-table';
import { useDebounce } from '../../hooks/useDebounce';
import { FuelModal } from './components/FuelModal';
import toast from 'react-hot-toast';
import { exportToCsv } from '../../utils/exportCsv';

export default function FuelManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<FuelLog | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['fuel', page, debouncedSearch],
    queryFn: () => FuelService.getLogs({ page, search: debouncedSearch }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => FuelService.deleteLog(id),
    onSuccess: () => {
      toast.success('Fuel log deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['fuel'] });
    },
  });

  const handleExport = async () => {
    const toastId = toast.loading('Preparing export...');
    try {
      const all = await FuelService.getLogs({ page: 1, search: '', page_size: 10000 });
      const rows = (all?.results || []).map((f: FuelLog) => ({
        id: f.fuel_log_number,
        vehicle: f.vehicle_registration || '',
        date: f.fuel_date,
        fuel_type: f.fuel_type,
        quantity_liters: f.quantity,
        total_cost: f.total_cost,
        efficiency_km_per_l: f.fuel_efficiency,
      }));
      exportToCsv(rows, 'Fuel_Report');
      toast.success('Export downloaded!', { id: toastId });
    } catch {
      toast.error('Export failed', { id: toastId });
    }
  };

  const columns: ColumnDef<FuelLog>[] = [
    {
      accessorKey: 'fuel_log_number',
      header: 'ID',
      cell: ({ row }) => <span className="font-semibold text-blue-600">{row.original.fuel_log_number}</span>
    },
    {
      accessorKey: 'vehicle_registration',
      header: 'Vehicle',
    },
    {
      accessorKey: 'fuel_date',
      header: 'Date',
    },
    {
      accessorKey: 'fuel_type',
      header: 'Type',
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
          {row.original.fuel_type}
        </span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => `${row.original.quantity} L`
    },
    {
      accessorKey: 'total_cost',
      header: 'Cost',
      cell: ({ row }) => `$${row.original.total_cost}`
    },
    {
      accessorKey: 'fuel_efficiency',
      header: 'Efficiency',
      cell: ({ row }) => `${row.original.fuel_efficiency} km/L`
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => {
            setSelectedLog(row.original);
            setIsModalOpen(true);
          }}>
            <Edit2 className="w-4 h-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            if (window.confirm('Are you sure you want to delete this log?')) {
              deleteMutation.mutate(row.original.id);
            }
          }}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) return <div>Failed to load fuel logs</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Fuel className="w-6 h-6 text-blue-500" />
            Fuel Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track fuel consumption, costs, and efficiency</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="primary" onClick={() => {
            setSelectedLog(null);
            setIsModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Log Fuel
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search by ID or Vehicle..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="secondary">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={data?.results || []} 
        isLoading={isLoading} 
      />

      <FuelModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLog(null);
          refetch();
        }} 
        log={selectedLog || undefined}
      />
    </div>
  );
}
