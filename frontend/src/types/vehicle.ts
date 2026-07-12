export interface Vehicle {
  id: string;
  image?: string;
  registration_number: string;
  vehicle_name: string;
  model: string;
  manufacturer: string;
  year: number;
  vehicle_type: string;
  vehicle_type_name?: string;
  region: string;
  region_name?: string;
  fuel_type: 'DIESEL' | 'PETROL' | 'ELECTRIC' | 'CNG' | 'HYBRID';
  maximum_load_capacity: number;
  current_odometer: number;
  acquisition_cost?: number;
  purchase_date?: string;
  insurance_number?: string;
  insurance_expiry?: string;
  fitness_expiry?: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE' | 'RETIRED';
  description?: string;
  created_at: string;
}
