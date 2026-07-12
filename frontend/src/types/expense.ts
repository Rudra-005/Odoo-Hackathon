export interface Expense {
  id: string;
  expense_number: string;
  category_name?: string;
  vehicle_registration?: string;
  trip_number?: string;
  driver_name?: string;
  category: any;
  vehicle?: any;
  trip?: any;
  driver?: any;
  vendor?: string;
  vendor_contact?: string;
  invoice_number?: string;
  invoice_upload?: string;
  expense_date: string;
  amount: number;
  tax: number;
  discount: number;
  net_amount: number;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'COMPANY_WALLET';
  reference_number?: string;
  description?: string;
  remarks?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
}
