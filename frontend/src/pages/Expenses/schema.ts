import { z } from 'zod';

export const expenseSchema = z.object({
  category: z.string().uuid('Please select a category'),
  vehicle: z.string().optional().nullable(),
  trip: z.string().optional().nullable(),
  driver: z.string().optional().nullable(),
  vendor: z.string().optional(),
  vendor_contact: z.string().optional(),
  invoice_number: z.string().optional(),
  expense_date: z.string().min(1, 'Expense date is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  tax: z.number().min(0, 'Tax cannot be negative').optional(),
  discount: z.number().min(0, 'Discount cannot be negative').optional(),
  payment_method: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'COMPANY_WALLET']),
  reference_number: z.string().optional(),
  description: z.string().optional(),
  remarks: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
