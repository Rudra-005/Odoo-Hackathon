import api from '../config/axios';
import { FuelLog } from '../types/fuel';

interface FetchFuelParams {
  page?: number;
  search?: string;
  vehicle?: string;
  driver?: string;
  fuel_type?: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

class FuelService {
  static async getLogs(params?: FetchFuelParams): Promise<PaginatedResponse<FuelLog>> {
    const response = await api.get('/fuel/', { params });
    return response.data;
  }

  static async getLog(id: string): Promise<FuelLog> {
    const response = await api.get(`/fuel/${id}/`);
    return response.data;
  }

  static async createLog(data: any): Promise<FuelLog> {
    const response = await api.post('/fuel/', data);
    return response.data;
  }

  static async updateLog(id: string, data: any): Promise<FuelLog> {
    const response = await api.patch(`/fuel/${id}/`, data);
    return response.data;
  }

  static async deleteLog(id: string): Promise<void> {
    await api.delete(`/fuel/${id}/`);
  }
}

export default FuelService;
