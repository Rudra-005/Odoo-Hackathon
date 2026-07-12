import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehicleSchema, VehicleFormData } from '../schema';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import VehicleService from '../../../services/vehicle.service';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: any;
}

export function VehicleModal({ isOpen, onClose, vehicle }: VehicleModalProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle || { status: 'AVAILABLE', fuel_type: 'DIESEL' }
  });

  useEffect(() => {
    if (vehicle) {
      reset(vehicle);
    } else {
      reset({ status: 'AVAILABLE', fuel_type: 'DIESEL' });
    }
  }, [vehicle, reset]);

  const onSubmit = async (data: VehicleFormData) => {
    setIsLoading(true);
    try {
      if (vehicle) {
        await VehicleService.updateVehicle(vehicle.id, data);
        toast.success('Vehicle updated successfully');
      } else {
        await VehicleService.createVehicle(data);
        toast.success('Vehicle added successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold">{vehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Registration Number</label>
              <Input {...register('registration_number')} error={errors.registration_number?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Vehicle Name</label>
              <Input {...register('vehicle_name')} error={errors.vehicle_name?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Model</label>
              <Input {...register('model')} error={errors.model?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Manufacturer</label>
              <Input {...register('manufacturer')} error={errors.manufacturer?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Capacity (KG)</label>
              <Input type="number" {...register('maximum_load_capacity', { valueAsNumber: true })} error={errors.maximum_load_capacity?.message} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>Save Vehicle</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
