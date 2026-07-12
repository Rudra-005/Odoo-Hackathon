export interface CompanyProfile {
  id: string;
  name: string;
  gst_number: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
}

export interface SystemSettings {
  id: string;
  company: CompanyProfile;
  timezone: string;
  currency: string;
  language: string;
  theme: string;
  company_logo?: string;
}
