import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { maintenanceSchema, MaintenanceFormData } from '../schema';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import MaintenanceService from '../../../services/maintenance.service';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  log?: any;
}

export function MaintenanceModal({ isOpen, onClose, log }: MaintenanceModalProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: log || { priority: 'MEDIUM' }
  });

  useEffect(() => {
    if (log) {
      reset(log);
    } else {
      reset({ priority: 'MEDIUM' });
    }
  }, [log, reset]);

  const onSubmit = async (data: MaintenanceFormData) => {
    setIsLoading(true);
    try {
      if (log) {
        await MaintenanceService.updateLog(log.id, data);
        toast.success('Maintenance log updated successfully');
      } else {
        await MaintenanceService.createLog(data);
        toast.success('Maintenance log added successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save maintenance log');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold">{log ? 'Edit Maintenance' : 'Schedule Maintenance'}</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">Issue Description</label>
              <Input {...register('issue')} error={errors.issue?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Workshop/Vendor</label>
              <Input {...register('vendor')} error={errors.vendor?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Estimated Cost ($)</label>
              <Input type="number" step="0.01" {...register('estimated_cost', { valueAsNumber: true })} error={errors.estimated_cost?.message} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>Save Schedule</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
