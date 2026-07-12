import api from '../config/axios';
import { Expense, ExpenseCategory } from '../types/expense';

interface FetchExpenseParams {
  page?: number;
  search?: string;
  category?: string;
  vehicle?: string;
  status?: string;
  page_size?: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

class ExpenseService {
  static async getExpenses(params?: FetchExpenseParams): Promise<PaginatedResponse<Expense>> {
    const response = await api.get('/expenses/', { params });
    return response.data;
  }
  
  static async getCategories(): Promise<PaginatedResponse<ExpenseCategory>> {
    const response = await api.get('/expenses/categories/');
    return response.data;
  }

  static async getExpense(id: string): Promise<Expense> {
    const response = await api.get(`/expenses/${id}/`);
    return response.data;
  }

  static async createExpense(data: any): Promise<Expense> {
    const response = await api.post('/expenses/', data);
    return response.data;
  }

  static async updateExpense(id: string, data: any): Promise<Expense> {
    const response = await api.patch(`/expenses/${id}/`, data);
    return response.data;
  }

  static async deleteExpense(id: string): Promise<void> {
    await api.delete(`/expenses/${id}/`);
  }

  // Workflow Actions
  static async approveExpense(id: string): Promise<Expense> {
    const response = await api.post(`/expenses/${id}/approve/`);
    return response.data;
  }

  static async rejectExpense(id: string): Promise<Expense> {
    const response = await api.post(`/expenses/${id}/reject/`);
    return response.data;
  }

  static async markPaid(id: string): Promise<Expense> {
    const response = await api.post(`/expenses/${id}/mark-paid/`);
    return response.data;
  }
}

export default ExpenseService;
