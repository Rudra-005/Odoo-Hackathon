import api from '../config/axios';
import { CompanyProfile } from '../types/settings';

class SettingsService {
  static async getCompanyProfile(): Promise<CompanyProfile> {
    const response = await api.get('/settings/company/');
    return response.data.data;
  }

  static async updateCompanyProfile(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
    const response = await api.put('/settings/company/', data);
    return response.data.data;
  }
}

export default SettingsService;
