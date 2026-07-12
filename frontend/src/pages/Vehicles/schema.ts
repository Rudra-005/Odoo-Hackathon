import { z } from 'zod';

export const vehicleSchema = z.object({
  registration_number: z.string().min(1, 'Registration number is required'),
  vehicle_name: z.string().min(1, 'Vehicle name is required'),
  model: z.string().min(1, 'Model is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  vehicle_type: z.string().uuid('Please select a valid vehicle type'),
  region: z.string().uuid('Please select a valid region'),
  fuel_type: z.enum(['DIESEL', 'PETROL', 'ELECTRIC', 'CNG', 'HYBRID']),
  maximum_load_capacity: z.number().positive('Capacity must be greater than 0'),
  current_odometer: z.number().min(0, 'Odometer cannot be negative'),
  acquisition_cost: z.number().optional().nullable(),
  purchase_date: z.string().optional().nullable(),
  insurance_number: z.string().optional().nullable(),
  insurance_expiry: z.string().optional().nullable(),
  fitness_expiry: z.string().optional().nullable(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'RETIRED']),
  description: z.string().optional().nullable(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
