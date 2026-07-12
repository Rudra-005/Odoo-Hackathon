import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit2, Trash2, Download, Receipt } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import ExpenseService from '../../services/expense.service';
import { Expense } from '../../types/expense';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';
import { ExpenseModal } from './components/ExpenseModal';

export default function Expenses() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['expenses', page, debouncedSearch],
    queryFn: () => ExpenseService.getExpenses({ page, search: debouncedSearch }),
  });

  const markPaidMutation = useMutation({
    mutationFn: ExpenseService.markPaid,
    onSuccess: () => {
      toast.success('Expense marked as paid');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update expense');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ExpenseService.deleteExpense(id),
    onSuccess: () => {
      toast.success('Expense deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: 'expense_number',
      header: 'ID',
      cell: ({ row }) => <span className="font-semibold text-blue-600">{row.original.expense_number}</span>
    },
    {
      accessorKey: 'category_name',
      header: 'Category',
    },
    {
      accessorKey: 'vehicle_registration',
      header: 'Vehicle',
      cell: ({ row }) => row.original.vehicle_registration || '-'
    },
    {
      accessorKey: 'vendor',
      header: 'Vendor',
      cell: ({ row }) => row.original.vendor || '-'
    },
    {
      accessorKey: 'expense_date',
      header: 'Date',
    },
    {
      accessorKey: 'net_amount',
      header: 'Net Amount',
      cell: ({ row }) => <span className="font-medium">${row.original.net_amount}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const colors = {
          PENDING: 'bg-yellow-100 text-yellow-800',
          APPROVED: 'bg-blue-100 text-blue-800',
          REJECTED: 'bg-red-100 text-red-800',
          PAID: 'bg-green-100 text-green-800',
          CANCELLED: 'bg-slate-100 text-slate-800',
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
        <div className="flex justify-end items-center gap-2">
          {row.original.status === 'APPROVED' && (
            <Button variant="secondary" size="sm" onClick={() => markPaidMutation.mutate(row.original.id)}>
              Pay
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => {
            setSelectedExpense(row.original);
            setIsModalOpen(true);
          }}>
            <Edit2 className="w-4 h-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            if (window.confirm('Are you sure you want to delete this expense?')) {
              deleteMutation.mutate(row.original.id);
            }
          }}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) return <div>Failed to load expenses</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-500" />
            Expenses
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage fleet expenses, approvals, and payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="primary" onClick={() => {
            setSelectedExpense(null);
            setIsModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search by ID, Vendor or Vehicle..." 
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

      <ExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExpense(null);
          refetch();
        }} 
        expense={selectedExpense || undefined}
      />
    </div>
  );
}
