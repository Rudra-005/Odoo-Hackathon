import { z } from 'zod';

export const fuelSchema = z.object({
  vehicle: z.string().uuid('Please select a vehicle'),
  trip: z.string().optional(),
  driver: z.string().optional(),
  fuel_station: z.string().optional(),
  fuel_vendor: z.string().optional(),
  fuel_type: z.enum(['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID', 'OTHER']),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  price_per_unit: z.number().min(0.01, 'Price must be greater than 0'),
  odometer_reading: z.number().min(0, 'Odometer reading is required'),
  payment_method: z.enum(['CASH', 'CARD', 'UPI', 'COMPANY_ACCOUNT']),
  invoice_number: z.string().optional(),
  fuel_date: z.string().min(1, 'Fuel date is required'),
  remarks: z.string().optional(),
});

export type FuelFormData = z.infer<typeof fuelSchema>;
