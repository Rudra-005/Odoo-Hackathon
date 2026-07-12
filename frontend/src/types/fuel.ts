export interface FuelLog {
  id: string;
  fuel_log_number: string;
  vehicle_registration?: string;
  driver_name?: string;
  trip_number?: string;
  vehicle: any;
  trip?: any;
  driver?: any;
  fuel_station: string;
  fuel_vendor: string;
  fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID' | 'OTHER';
  quantity: number;
  price_per_unit: number;
  total_cost: number;
  odometer_reading: number;
  distance_since_last: number;
  fuel_efficiency: number;
  payment_method: 'CASH' | 'CARD' | 'UPI' | 'COMPANY_ACCOUNT';
  invoice_number?: string;
  invoice_upload?: string;
  fuel_date: string;
  remarks?: string;
  created_at: string;
}
