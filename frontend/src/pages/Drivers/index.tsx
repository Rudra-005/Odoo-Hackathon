import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit2, Trash2, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import DriverService from '../../services/driver.service';
import { Driver } from '../../types/driver';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';
import { DriverModal } from './components/DriverModal';
import { exportToCsv } from '../../utils/exportCsv';

export default function Drivers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['drivers', page, debouncedSearch],
    queryFn: () => DriverService.getDrivers({ page, search: debouncedSearch }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DriverService.deleteDriver(id),
    onSuccess: () => {
      toast.success('Driver deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });

  const handleExport = async () => {
    const toastId = toast.loading('Preparing export...');
    try {
      const all = await DriverService.getDrivers({ page: 1, search: '', page_size: 10000 });
      const rows = (all?.results || []).map((d: Driver) => ({
        driver_code: d.driver_code,
        name: d.driver_name,
        phone: d.phone || '',
        license: d.license_number || '',
        safety_score: d.safety_score,
        status: d.status,
      }));
      exportToCsv(rows, 'Drivers_Report');
      toast.success('Export downloaded!', { id: toastId });
    } catch {
      toast.error('Export failed', { id: toastId });
    }
  };

  const columns: ColumnDef<Driver>[] = [
    {
      accessorKey: 'driver_code',
      header: 'Code',
    },
    {
      accessorKey: 'driver_name',
      header: 'Driver Name',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      accessorKey: 'license_number',
      header: 'License',
    },
    {
      accessorKey: 'safety_score',
      header: 'Safety Score',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const colors: any = {
          AVAILABLE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          ON_TRIP: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          OFF_DUTY: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
          SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-400',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
            {status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => {
            setSelectedDriver(row.original);
            setIsModalOpen(true);
          }}>
            <Edit2 className="w-4 h-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            if (window.confirm('Are you sure you want to delete this driver?')) {
              deleteMutation.mutate(row.original.id);
            }
          }}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) return <div>Failed to load drivers</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Drivers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage fleet operators and licenses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="primary" onClick={() => {
            setSelectedDriver(null);
            setIsModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Driver
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search drivers..." 
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

      <DriverModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDriver(null);
        }}
        driver={selectedDriver || undefined}
      />
    </div>
  );
}
