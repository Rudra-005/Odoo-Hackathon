export interface MaintenanceLog {
  id: string;
  maintenance_id: string;
  vehicle_registration?: string;
  maintenance_type_name?: string;
  vehicle: any;
  maintenance_type: any;
  workshop: string;
  vendor: string;
  mechanic_name: string;
  mechanic_contact: string;
  issue: string;
  diagnosis: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimated_cost: number;
  actual_cost: number;
  start_date?: string;
  estimated_completion?: string;
  actual_completion?: string;
  invoice_number?: string;
  invoice_upload?: string;
  parts_used?: string;
  warranty?: string;
  remarks?: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}
