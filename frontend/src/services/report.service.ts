import api from '../config/axios';

export interface ReportFilterParams {
  start_date?: string;
  end_date?: string;
  vehicle_id?: string;
  driver_id?: string;
  status?: string;
}

class ReportService {
  static async getFleetReport(params?: ReportFilterParams) {
    const response = await api.get('/reports/fleet/', { params });
    return response.data;
  }

  static async getFinancialReport(params?: ReportFilterParams) {
    const response = await api.get('/reports/financial/', { params });
    return response.data;
  }

  static async getTripReport(params?: ReportFilterParams) {
    const response = await api.get('/reports/trips/', { params });
    return response.data;
  }

  static async exportReport(reportType: string, format: 'csv' | 'excel' | 'pdf', filters: ReportFilterParams) {
    const response = await api.post(`/reports/export/${format}/`, {
      report_type: reportType,
      filters: filters
    }, {
      responseType: 'blob' // Crucial for file downloads
    });
    
    // Trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const extensions = {
      'csv': 'csv',
      'excel': 'xlsx',
      'pdf': 'pdf'
    };
    
    link.setAttribute('download', `TransitOps_${reportType}_Report_${new Date().getTime()}.${extensions[format]}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export default ReportService;
