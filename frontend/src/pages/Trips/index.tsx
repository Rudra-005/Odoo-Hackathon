import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit2, Trash2, Download, Play, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import TripService from '../../services/trip.service';
import { Trip } from '../../types/trip';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';
import { TripModal } from './components/TripModal';
import { exportToCsv } from '../../utils/exportCsv';

export default function Trips() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['trips', page, debouncedSearch],
    queryFn: () => TripService.getTrips({ page, search: debouncedSearch }),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => TripService.deleteTrip(id),
    onSuccess: () => {
      toast.success('Trip deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const handleExport = async () => {
    const toastId = toast.loading('Preparing export...');
    try {
      const all = await TripService.getTrips({ page: 1, search: '', page_size: 10000 });
      const rows = (all?.results || []).map((t: Trip) => ({
        trip_number: t.trip_number,
        vehicle: t.vehicle_reg || '',
        driver: t.driver_name || '',
        source: t.source || '',
        destination: t.destination || '',
        status: t.status,
        revenue: t.revenue || 0,
      }));
      exportToCsv(rows, 'Trips_Report');
      toast.success('Export downloaded!', { id: toastId });
    } catch {
      toast.error('Export failed', { id: toastId });
    }
  };

  const columns: ColumnDef<Trip>[] = [
    {
      accessorKey: 'trip_number',
      header: 'Trip #',
      cell: ({ row }) => <span className="font-semibold">{row.original.trip_number}</span>
    },
    {
      accessorKey: 'vehicle_reg',
      header: 'Vehicle',
    },
    {
      accessorKey: 'driver_name',
      header: 'Driver',
    },
    {
      accessorKey: 'source',
      header: 'Source',
    },
    {
      accessorKey: 'destination',
      header: 'Destination',
    },
    {
      accessorKey: 'revenue',
      header: 'Revenue',
      cell: ({ row }) => `$${row.original.revenue}`
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const colors = {
          DRAFT: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
          DISPATCHED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
          IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
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
            setSelectedTrip(row.original);
            setIsModalOpen(true);
          }}>
            <Edit2 className="w-4 h-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            if (window.confirm('Are you sure you want to delete this trip?')) {
              deleteMutation.mutate(row.original.id);
            }
          }}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) return <div>Failed to load trips</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trips</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage dispatch operations and lifecycles</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="primary" onClick={() => {
            setSelectedTrip(null);
            setIsModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Trip
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search trips..." 
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

      <TripModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTrip(null);
        }}
        trip={selectedTrip || undefined}
      />
    </div>
  );
}
