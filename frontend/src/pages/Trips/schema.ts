import { z } from 'zod';

export const tripSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  destination: z.string().min(1, 'Destination is required'),
  intermediate_stops: z.string().optional(),
  vehicle: z.string().uuid('Please select a vehicle'),
  driver: z.string().uuid('Please select a driver'),
  cargo_type: z.string().min(1, 'Cargo type is required'),
  cargo_description: z.string().optional(),
  cargo_weight: z.number().min(0, 'Weight cannot be negative'),
  planned_distance: z.number().min(0, 'Distance cannot be negative'),
  estimated_duration: z.number().min(0, 'Duration cannot be negative').optional(),
  revenue: z.number().min(0, 'Revenue cannot be negative'),
  customer_name: z.string().optional(),
  customer_contact: z.string().optional(),
  remarks: z.string().optional(),
  planned_start_time: z.string().min(1, 'Planned start time is required'),
  planned_end_time: z.string().min(1, 'Planned end time is required'),
});

export type TripFormData = z.infer<typeof tripSchema>;
