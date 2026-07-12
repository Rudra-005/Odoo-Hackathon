import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tripSchema, TripFormData } from '../schema';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import TripService from '../../../services/trip.service';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip?: any;
}

const formatForInput = (isoString?: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export function TripModal({ isOpen, onClose, trip }: TripModalProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: trip ? {
      ...trip,
      planned_start_time: formatForInput(trip.planned_start_time),
      planned_end_time: formatForInput(trip.planned_end_time),
    } : {}
  });

  const watchedStart = watch('planned_start_time');
  const watchedEnd = watch('planned_end_time');
  const watchedVehicle = watch('vehicle');
  const watchedDriver = watch('driver');
  const watchedWeight = watch('cargo_weight');

  useEffect(() => {
    if (trip) {
      reset({
        ...trip,
        planned_start_time: formatForInput(trip.planned_start_time),
        planned_end_time: formatForInput(trip.planned_end_time),
      });
    } else {
      reset({});
    }
  }, [trip, reset]);

  // Load available vehicles and drivers when times change
  useEffect(() => {
    if (watchedStart && watchedEnd) {
      try {
        const startISO = new Date(watchedStart).toISOString();
        const endISO = new Date(watchedEnd).toISOString();
        
        TripService.getAvailableVehicles(startISO, endISO)
          .then(res => setVehicles(res))
          .catch(console.error);
          
        TripService.getAvailableDrivers(startISO, endISO)
          .then(res => setDrivers(res))
          .catch(console.error);
      } catch (e) {
        // Invalid date format, ignore
      }
    } else {
      setVehicles([]);
      setDrivers([]);
    }
  }, [watchedStart, watchedEnd]);

  // Immediately validate vehicle, driver, maintenance availability without page reload
  useEffect(() => {
    if (watchedStart && watchedEnd && (watchedVehicle || watchedDriver)) {
      try {
        const startISO = new Date(watchedStart).toISOString();
        const endISO = new Date(watchedEnd).toISOString();
        
        const payload: any = {
          planned_start_time: startISO,
          planned_end_time: endISO,
        };
        if (watchedVehicle) payload.vehicle = watchedVehicle;
        if (watchedDriver) payload.driver = watchedDriver;
        if (watchedWeight) payload.cargo_weight = watchedWeight;
        if (trip) payload.trip_id = trip.id;
        
        TripService.checkAvailability(payload)
          .then(res => {
            if (res.available) {
              setAvailabilityError(null);
            }
          })
          .catch(err => {
            const backendErrors = err.response?.data?.errors;
            if (backendErrors) {
              const errorMsg = Object.values(backendErrors).flat().join(', ');
              setAvailabilityError(errorMsg);
            } else {
              setAvailabilityError('Selected resource has scheduling conflict or is in maintenance.');
            }
          });
      } catch (e) {
        // Invalid date, ignore
      }
    } else {
      setAvailabilityError(null);
    }
  }, [watchedStart, watchedEnd, watchedVehicle, watchedDriver, watchedWeight, trip]);

  const onSubmit = async (data: TripFormData) => {
    setIsLoading(true);
    const payload = {
      ...data,
      planned_start_time: new Date(data.planned_start_time).toISOString(),
      planned_end_time: new Date(data.planned_end_time).toISOString(),
    };
    try {
      if (trip) {
        await TripService.updateTrip(trip.id, payload);
        toast.success('Trip updated successfully');
      } else {
        await TripService.createTrip(payload);
        toast.success('Trip added successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 
                       (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null) || 
                       'Failed to save trip';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold">{trip ? 'Edit Trip' : 'Create Trip'}</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {availabilityError && (
            <div className="p-3 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium border border-red-200 dark:border-red-900/50">
              ⚠️ {availabilityError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Source</label>
              <Input {...register('source')} error={errors.source?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Destination</label>
              <Input {...register('destination')} error={errors.destination?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Planned Start Time</label>
              <Input type="datetime-local" {...register('planned_start_time')} error={errors.planned_start_time?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Planned End Time</label>
              <Input type="datetime-local" {...register('planned_end_time')} error={errors.planned_end_time?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Assigned Vehicle</label>
              <select
                {...register('vehicle')}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Vehicle</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {v.registration_number} - {v.vehicle_name} ({v.maximum_load_capacity} kg)
                  </option>
                ))}
              </select>
              {errors.vehicle?.message && <span className="text-xs text-red-500 mt-1">{errors.vehicle.message}</span>}
            </div>
            <div>
              <label className="text-sm font-medium">Assigned Driver</label>
              <select
                {...register('driver')}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Select Driver</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {d.first_name} {d.last_name} - {d.assigned_vehicle_reg ? `(Vehicle: ${d.assigned_vehicle_reg})` : '(No Vehicle)'} (Score: {d.safety_score})
                  </option>
                ))}
              </select>
              {errors.driver?.message && <span className="text-xs text-red-500 mt-1">{errors.driver.message}</span>}
            </div>
            <div>
              <label className="text-sm font-medium">Cargo Type</label>
              <Input {...register('cargo_type')} error={errors.cargo_type?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Cargo Weight (KG)</label>
              <Input type="number" step="0.01" {...register('cargo_weight', { valueAsNumber: true })} error={errors.cargo_weight?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Revenue</label>
              <Input type="number" step="0.01" {...register('revenue', { valueAsNumber: true })} error={errors.revenue?.message} />
            </div>
            <div>
              <label className="text-sm font-medium">Planned Distance (KM)</label>
              <Input type="number" step="0.01" {...register('planned_distance', { valueAsNumber: true })} error={errors.planned_distance?.message} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>Save Trip</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
