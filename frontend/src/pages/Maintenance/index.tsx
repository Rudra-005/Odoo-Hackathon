import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit2, Trash2, Download, Wrench } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import MaintenanceService from '../../services/maintenance.service';
import { MaintenanceLog } from '../../types/maintenance';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';
import { MaintenanceModal } from './components/MaintenanceModal';
import { exportToCsv } from '../../utils/exportCsv';

export default function Maintenance() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['maintenance', page, debouncedSearch],
    queryFn: () => MaintenanceService.getLogs({ page, search: debouncedSearch }),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => MaintenanceService.deleteLog(id),
    onSuccess: () => {
      toast.success('Maintenance record deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });

  const handleExport = async () => {
    const toastId = toast.loading('Preparing export...');
    try {
      const all = await MaintenanceService.getLogs({ page: 1, search: '', page_size: 10000 });
      const rows = (all?.results || []).map((m: MaintenanceLog) => ({
        id: m.maintenance_id,
        vehicle: m.vehicle_registration || '',
        type: m.maintenance_type_name || '',
        vendor: m.vendor || m.workshop || '',
        priority: m.priority,
        estimated_cost: m.estimated_cost,
        status: m.status,
      }));
      exportToCsv(rows, 'Maintenance_Report');
      toast.success('Export downloaded!', { id: toastId });
    } catch {
      toast.error('Export failed', { id: toastId });
    }
  };

  const columns: ColumnDef<MaintenanceLog>[] = [
    {
      accessorKey: 'maintenance_id',
      header: 'ID',
      cell: ({ row }) => <span className="font-semibold text-blue-600 dark:text-blue-400">{row.original.maintenance_id}</span>
    },
    {
      accessorKey: 'vehicle_registration',
      header: 'Vehicle',
    },
    {
      accessorKey: 'maintenance_type_name',
      header: 'Type',
    },
    {
      accessorKey: 'vendor',
      header: 'Vendor/Workshop',
      cell: ({ row }) => row.original.vendor || row.original.workshop || '-'
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const p = row.original.priority;
        const colors = {
          LOW: 'bg-slate-100 text-slate-800',
          MEDIUM: 'bg-blue-100 text-blue-800',
          HIGH: 'bg-orange-100 text-orange-800',
          CRITICAL: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[p]}`}>
            {p}
          </span>
        );
      },
    },
    {
      accessorKey: 'estimated_cost',
      header: 'Est. Cost',
      cell: ({ row }) => `$${row.original.estimated_cost}`
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const colors = {
          SCHEDULED: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
          ACTIVE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
          COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
            {status}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => {
            setSelectedLog(row.original);
            setIsModalOpen(true);
          }}>
            <Edit2 className="w-4 h-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            if (window.confirm('Are you sure you want to delete this record?')) {
              deleteMutation.mutate(row.original.id);
            }
          }}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) return <div>Failed to load maintenance logs</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-500" />
            Maintenance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track vehicle repairs, costs, and shop schedules</p>
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
            Schedule Maintenance
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search by ID, Vehicle, or Vendor..." 
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

      <MaintenanceModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLog(null);
        }}
        log={selectedLog || undefined}
      />
    </div>
  );
}
