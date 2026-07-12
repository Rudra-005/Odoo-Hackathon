import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit2, Trash2, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import VehicleService from '../../services/vehicle.service';
import { Vehicle } from '../../types/vehicle';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';
import { VehicleModal } from './components/VehicleModal';
import { exportToCsv } from '../../utils/exportCsv';

export default function Vehicles() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicles', page, debouncedSearch],
    queryFn: () => VehicleService.getVehicles({ page, search: debouncedSearch }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => VehicleService.deleteVehicle(id),
    onSuccess: () => {
      toast.success('Vehicle deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const handleExport = async () => {
    const toastId = toast.loading('Preparing export...');
    try {
      const all = await VehicleService.getVehicles({ page: 1, search: '', page_size: 10000 });
      const rows = (all?.results || []).map((v: Vehicle) => ({
        registration_number: v.registration_number,
        vehicle_name: v.vehicle_name,
        type: v.vehicle_type_name || '',
        region: v.region_name || '',
        status: v.status,
        current_odometer: v.current_odometer,
        fuel_type: v.fuel_type || '',
        year: v.year || '',
      }));
      exportToCsv(rows, 'Vehicles_Report');
      toast.success('Export downloaded!', { id: toastId });
    } catch {
      toast.error('Export failed', { id: toastId });
    }
  };

  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: 'registration_number',
      header: 'Registration',
    },
    {
      accessorKey: 'vehicle_name',
      header: 'Vehicle',
    },
    {
      accessorKey: 'vehicle_type_name',
      header: 'Type',
    },
    {
      accessorKey: 'region_name',
      header: 'Region',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const colors = {
          AVAILABLE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          ON_TRIP: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          MAINTENANCE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
          RETIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
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
            setSelectedVehicle(row.original);
            setIsModalOpen(true);
          }}>
            <Edit2 className="w-4 h-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            if (window.confirm('Are you sure you want to delete this vehicle?')) {
              deleteMutation.mutate(row.original.id);
            }
          }}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) return <div>Failed to load vehicles</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vehicles</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your entire fleet registry</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="primary" onClick={() => {
            setSelectedVehicle(null);
            setIsModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search vehicles..." 
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

      <VehicleModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVehicle(null);
        }}
        vehicle={selectedVehicle || undefined}
      />
    </div>
  );
}
