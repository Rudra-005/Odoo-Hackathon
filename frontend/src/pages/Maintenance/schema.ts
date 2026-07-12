import { z } from 'zod';

export const maintenanceSchema = z.object({
  vehicle: z.string().uuid('Please select a vehicle'),
  maintenance_type: z.string().uuid('Please select maintenance type'),
  workshop: z.string().optional(),
  vendor: z.string().optional(),
  mechanic_name: z.string().optional(),
  mechanic_contact: z.string().optional(),
  issue: z.string().min(1, 'Issue is required'),
  diagnosis: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  estimated_cost: z.number().min(0, 'Cost cannot be negative'),
  estimated_completion: z.string().optional(),
  parts_used: z.string().optional(),
  warranty: z.string().optional(),
  remarks: z.string().optional(),
});

export type MaintenanceFormData = z.infer<typeof maintenanceSchema>;
