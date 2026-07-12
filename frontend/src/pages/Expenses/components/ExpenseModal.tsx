import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema, ExpenseFormData } from '../schema';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import ExpenseService from '../../../services/expense.service';
import VehicleService from '../../../services/vehicle.service';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: any;
}

export function ExpenseModal({ isOpen, onClose, expense }: ExpenseModalProps) {
  const queryClient = useQueryClient();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { 
      payment_method: 'BANK_TRANSFER',
      expense_date: new Date().toISOString().split('T')[0],
      tax: 0,
      discount: 0
    }
  });

  const amount = watch('amount') || 0;
  const tax = watch('tax') || 0;
  const discount = watch('discount') || 0;
  const netAmount = (amount + tax - discount).toFixed(2);

  useEffect(() => {
    if (isOpen) {
      VehicleService.getVehicles().then(res => setVehicles(res.results)).catch(console.error);
      ExpenseService.getCategories().then(res => setCategories(res.results)).catch(console.error);
    }
    if (expense) {
      reset(expense);
    } else {
      reset({ 
        payment_method: 'BANK_TRANSFER',
        expense_date: new Date().toISOString().split('T')[0],
        tax: 0,
        discount: 0
      });
    }
  }, [isOpen, expense, reset]);

  const onSubmit = async (data: ExpenseFormData) => {
    setIsLoading(true);
    try {
      if (expense) {
        await ExpenseService.updateExpense(expense.id, data);
        toast.success('Expense updated successfully');
      } else {
        await ExpenseService.createExpense(data);
        toast.success('Expense created successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save expense');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold">{expense ? 'Edit Expense' : 'Add Expense'}</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select 
                {...register('category')}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
              >
                <option value="">Select category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.category && <span className="text-xs text-red-500 mt-1">{errors.category.message}</span>}
            </div>
            
            <div>
              <label className="text-sm font-medium">Vehicle (Optional)</label>
              <select 
                {...register('vehicle')}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
              >
                <option value="">Select a vehicle...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registration_number}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Vendor</label>
              <Input {...register('vendor')} error={errors.vendor?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Expense Date</label>
              <Input type="date" {...register('expense_date')} error={errors.expense_date?.message} />
            </div>

            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} error={errors.amount?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Tax</label>
              <Input type="number" step="0.01" {...register('tax', { valueAsNumber: true })} error={errors.tax?.message} />
            </div>
            
            <div>
              <label className="text-sm font-medium">Discount</label>
              <Input type="number" step="0.01" {...register('discount', { valueAsNumber: true })} error={errors.discount?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Net Amount (Auto-calculated)</label>
              <Input value={netAmount} disabled className="bg-slate-50 dark:bg-slate-900 font-bold" />
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium">Description / Remarks</label>
              <Input {...register('description')} error={errors.description?.message} />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>Save Expense</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
