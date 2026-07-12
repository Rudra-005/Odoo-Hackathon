import { z } from 'zod';

export const driverSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone required'),
  email: z.string().email().optional().or(z.literal('')),
  assigned_vehicle: z.string().nullable().optional().or(z.literal('')),
  // Optional backend fields
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).optional(),
  license: z.object({
    license_number: z.string().optional().or(z.literal('')),
    license_category: z.string().optional().or(z.literal('')),
    license_expiry: z.string().optional().or(z.literal('')),
  }).optional(),
});

export type DriverFormData = z.infer<typeof driverSchema>;
