export interface DriverLicense {
  license_number: string;
  license_category: string;
  license_issue_date?: string;
  license_expiry: string;
  license_authority?: string;
  document_url?: string;
}

export interface Driver {
  id: string;
  driver_code: string;
  first_name: string;
  last_name: string;
  driver_name: string;
  gender: string;
  dob: string;
  blood_group?: string;
  email?: string;
  phone: string;
  alt_phone?: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  joining_date: string;
  experience: number;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  medical_certificate_number?: string;
  medical_certificate_expiry?: string;
  safety_score: string;
  salary: string;
  remarks?: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
  photo?: string;
  license?: DriverLicense;
  license_number?: string;
  license_category?: string;
  license_expiry?: string;
  created_at: string;
}
