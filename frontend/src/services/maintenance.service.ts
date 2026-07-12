import api from '../config/axios';
import { MaintenanceLog } from '../types/maintenance';

interface FetchMaintenanceParams {
  page?: number;
  search?: string;
  status?: string;
  vehicle?: string;
  priority?: string;
  page_size?: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

class MaintenanceService {
  static async getLogs(params?: FetchMaintenanceParams): Promise<PaginatedResponse<MaintenanceLog>> {
    const response = await api.get('/maintenance/', { params });
    return response.data;
  }

  static async getLog(id: string): Promise<MaintenanceLog> {
    const response = await api.get(`/maintenance/${id}/`);
    return response.data;
  }

  static async createLog(data: any): Promise<MaintenanceLog> {
    const response = await api.post('/maintenance/', data);
    return response.data;
  }

  static async updateLog(id: string, data: any): Promise<MaintenanceLog> {
    const response = await api.patch(`/maintenance/${id}/`, data);
    return response.data;
  }

  static async deleteLog(id: string): Promise<void> {
    await api.delete(`/maintenance/${id}/`);
  }

  // Workflow Actions
  static async startMaintenance(id: string): Promise<MaintenanceLog> {
    const response = await api.post(`/maintenance/${id}/start/`);
    return response.data;
  }

  static async completeMaintenance(id: string, completionData: any): Promise<MaintenanceLog> {
    const response = await api.post(`/maintenance/${id}/complete/`, completionData);
    return response.data;
  }

  static async cancelMaintenance(id: string): Promise<MaintenanceLog> {
    const response = await api.post(`/maintenance/${id}/cancel/`);
    return response.data;
  }
}

export default MaintenanceService;
