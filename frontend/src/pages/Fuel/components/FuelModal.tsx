import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fuelSchema, FuelFormData } from '../schema';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import FuelService from '../../../services/fuel.service';
import VehicleService from '../../../services/vehicle.service';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface FuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  log?: any;
}

export function FuelModal({ isOpen, onClose, log }: FuelModalProps) {
  const queryClient = useQueryClient();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<FuelFormData>({
    resolver: zodResolver(fuelSchema),
    defaultValues: { 
      fuel_type: 'DIESEL', 
      payment_method: 'CARD',
      fuel_date: new Date().toISOString().split('T')[0]
    }
  });

  const qty = watch('quantity') || 0;
  const price = watch('price_per_unit') || 0;
  const totalCost = (qty * price).toFixed(2);

  useEffect(() => {
    if (isOpen) {
      VehicleService.getVehicles().then(res => setVehicles(res.results)).catch(console.error);
    }
    if (log) {
      reset(log);
    } else {
      reset({ 
        fuel_type: 'DIESEL', 
        payment_method: 'CARD',
        fuel_date: new Date().toISOString().split('T')[0]
      });
    }
  }, [isOpen, log, reset]);

  const onSubmit = async (data: FuelFormData) => {
    setIsLoading(true);
    try {
      if (log) {
        await FuelService.updateLog(log.id, data);
        toast.success('Fuel log updated successfully');
      } else {
        await FuelService.createLog(data);
        toast.success('Fuel log created successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['fuel'] });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save fuel log');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold">{log ? 'Edit Fuel Entry' : 'Log Fuel Entry'}</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">Vehicle</label>
              <select 
                {...register('vehicle')}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
              >
                <option value="">Select a vehicle...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registration_number}</option>
                ))}
              </select>
              {errors.vehicle && <span className="text-xs text-red-500 mt-1">{errors.vehicle.message}</span>}
            </div>

            <div>
              <label className="text-sm font-medium">Quantity (Liters)</label>
              <Input type="number" step="0.01" {...register('quantity', { valueAsNumber: true })} error={errors.quantity?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Price Per Liter</label>
              <Input type="number" step="0.01" {...register('price_per_unit', { valueAsNumber: true })} error={errors.price_per_unit?.message} />
            </div>

            <div>
              <label className="text-sm font-medium">Total Cost (Auto-calculated)</label>
              <Input value={totalCost} disabled className="bg-slate-50 dark:bg-slate-900" />
            </div>
            <div>
              <label className="text-sm font-medium">Current Odometer</label>
              <Input type="number" step="1" {...register('odometer_reading', { valueAsNumber: true })} error={errors.odometer_reading?.message} />
            </div>

            <div>
              <label className="text-sm font-medium">Fuel Date</label>
              <Input type="date" {...register('fuel_date')} error={errors.fuel_date?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Vendor/Station</label>
              <Input {...register('fuel_vendor')} error={errors.fuel_vendor?.message} />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>Save Fuel Log</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
