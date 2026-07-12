import api from '../config/axios';
import { Driver } from '../types/driver';

interface FetchDriversParams {
  page?: number;
  search?: string;
  status?: string;
  license_category?: string;
  ordering?: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

class DriverService {
  static async getDrivers(params?: FetchDriversParams): Promise<PaginatedResponse<Driver>> {
    const response = await api.get('/drivers/', { params });
    return response.data;
  }

  static async getDriver(id: string): Promise<Driver> {
    const response = await api.get(`/drivers/${id}/`);
    return response.data;
  }

  static async createDriver(data: any): Promise<Driver> {
    const response = await api.post('/drivers/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  static async updateDriver(id: string, data: any): Promise<Driver> {
    const response = await api.patch(`/drivers/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  static async deleteDriver(id: string): Promise<void> {
    await api.delete(`/drivers/${id}/`);
  }

  static async bulkDelete(ids: string[]): Promise<void> {
    await api.post('/drivers/bulk-delete/', { ids });
  }

  static async bulkUpdateStatus(ids: string[], status: string): Promise<void> {
    await api.post('/drivers/bulk-status/', { ids, status });
  }
}

export default DriverService;
