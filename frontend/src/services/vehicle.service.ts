import api from '../config/axios';
import { Vehicle } from '../types/vehicle';

interface FetchVehiclesParams {
  page?: number;
  search?: string;
  status?: string;
  vehicle_type?: string;
  region?: string;
  ordering?: string;
  page_size?: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

class VehicleService {
  static async getVehicles(params?: FetchVehiclesParams): Promise<PaginatedResponse<Vehicle>> {
    const response = await api.get('/vehicles/', { params });
    return response.data;
  }

  static async getVehicle(id: string): Promise<Vehicle> {
    const response = await api.get(`/vehicles/${id}/`);
    return response.data;
  }

  static async createVehicle(data: any): Promise<Vehicle> {
    const response = await api.post('/vehicles/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  static async updateVehicle(id: string, data: any): Promise<Vehicle> {
    const response = await api.patch(`/vehicles/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  static async deleteVehicle(id: string): Promise<void> {
    await api.delete(`/vehicles/${id}/`);
  }

  static async bulkDelete(ids: string[]): Promise<void> {
    await api.post('/vehicles/bulk-delete/', { ids });
  }

  static async bulkUpdateStatus(ids: string[], status: string): Promise<void> {
    await api.post('/vehicles/bulk-status/', { ids, status });
  }
}

export default VehicleService;
