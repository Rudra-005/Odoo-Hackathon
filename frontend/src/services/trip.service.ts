import api from '../config/axios';
import { Trip } from '../types/trip';

interface FetchTripsParams {
  page?: number;
  search?: string;
  status?: string;
  vehicle?: string;
  driver?: string;
  ordering?: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

class TripService {
  static async getTrips(params?: FetchTripsParams): Promise<PaginatedResponse<Trip>> {
    const response = await api.get('/trips/', { params });
    return response.data;
  }

  static async getTrip(id: string): Promise<Trip> {
    const response = await api.get(`/trips/${id}/`);
    return response.data;
  }

  static async createTrip(data: any): Promise<Trip> {
    const response = await api.post('/trips/', data);
    return response.data;
  }

  static async updateTrip(id: string, data: any): Promise<Trip> {
    const response = await api.patch(`/trips/${id}/`, data);
    return response.data;
  }

  static async deleteTrip(id: string): Promise<void> {
    await api.delete(`/trips/${id}/`);
  }

  // ----------------------------------------------------
  // Workflow / State Machine
  // ----------------------------------------------------

  static async dispatchTrip(id: string): Promise<Trip> {
    const response = await api.post(`/trips/${id}/dispatch/`);
    return response.data;
  }

  static async startTrip(id: string): Promise<Trip> {
    const response = await api.post(`/trips/${id}/start/`);
    return response.data;
  }

  static async completeTrip(id: string, completionData: any): Promise<Trip> {
    const response = await api.post(`/trips/${id}/complete/`, completionData);
    return response.data;
  }

  static async cancelTrip(id: string): Promise<Trip> {
    const response = await api.post(`/trips/${id}/cancel/`);
    return response.data;
  }

  // ----------------------------------------------------
  // Scheduling & Availability
  // ----------------------------------------------------

  static async getAvailableVehicles(start: string, end: string): Promise<any[]> {
    const response = await api.get('/trips/availability/vehicles/', {
      params: { planned_start_time: start, planned_end_time: end }
    });
    return response.data;
  }

  static async getAvailableDrivers(start: string, end: string): Promise<any[]> {
    const response = await api.get('/trips/availability/drivers/', {
      params: { planned_start_time: start, planned_end_time: end }
    });
    return response.data;
  }

  static async checkAvailability(payload: {
    vehicle?: string;
    driver?: string;
    planned_start_time: string;
    planned_end_time: string;
    cargo_weight?: number;
    trip_id?: string;
  }): Promise<{ available: boolean; errors?: any }> {
    const response = await api.post('/trips/check-availability/', payload);
    return response.data;
  }
}

export default TripService;
