import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { driverSchema, DriverFormData } from '../schema';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import DriverService from '../../../services/driver.service';
import VehicleService from '../../../services/vehicle.service';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: any;
}

export function DriverModal({ isOpen, onClose, driver }: DriverModalProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: driver || { status: 'AVAILABLE', gender: 'MALE' }
  });

  useEffect(() => {
    if (isOpen) {
      VehicleService.getVehicles().then(res => setVehicles(res.results)).catch(console.error);
    }
    if (driver) {
      reset(driver);
    } else {
      reset({ status: 'AVAILABLE', gender: 'MALE' });
    }
  }, [isOpen, driver, reset]);

  const onSubmit = async (data: DriverFormData) => {
    setIsLoading(true);
    // Copy data for payload
    const payload = { ...data };
    
    // If assigned_vehicle is empty string, make it null
    if (!payload.assigned_vehicle) {
      payload.assigned_vehicle = null;
    }
    
    // Remove empty license object
    if (payload.license && !payload.license.license_number) {
      delete payload.license;
    }

    try {
      if (driver) {
        await DriverService.updateDriver(driver.id, payload);
        toast.success('Driver updated successfully');
      } else {
        await DriverService.createDriver(payload);
        toast.success('Driver added successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save driver');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold">{driver ? 'Edit Driver' : 'Add Driver'}</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">First Name</label>
              <Input {...register('first_name')} error={errors.first_name?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name</label>
              <Input {...register('last_name')} error={errors.last_name?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input {...register('phone')} error={errors.phone?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <Input type="email" {...register('email')} error={errors.email?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Assigned Vehicle (Optional)</label>
              <select 
                {...register('assigned_vehicle')}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">No Vehicle Assigned</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {v.registration_number} - {v.vehicle_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold mb-4">License Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">License Number</label>
                <Input {...register('license.license_number')} error={errors.license?.license_number?.message} />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select 
                  {...register('license.license_category')}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Category</option>
                  <option value="LMV" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Light Motor Vehicle</option>
                  <option value="HMV" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Heavy Motor Vehicle</option>
                  <option value="TRANSPORT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Transport</option>
                  <option value="HGMV" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Heavy Goods Motor Vehicle</option>
                  <option value="PASSENGER" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Passenger</option>
                  <option value="OTHER" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Other</option>
                </select>
                {errors.license?.license_category?.message && <span className="text-red-500 text-xs">{errors.license.license_category.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Expiry Date</label>
                <Input type="date" {...register('license.license_expiry')} error={errors.license?.license_expiry?.message} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>Save Driver</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
