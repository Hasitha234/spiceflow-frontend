import apiClient from './client';
import type { Expense, ExpenseRequest } from '../types/finance';

const BASE_URL = '/api/finance/expenses';

export const financeApi = {
  createExpense: async (data: ExpenseRequest): Promise<Expense> => {
    const response = await apiClient.post(BASE_URL, data);
    return response.data;
  },

  getExpensesForMonth: async (yearMonth: string): Promise<Expense[]> => {
    const response = await apiClient.get(`${BASE_URL}?yearMonth=${yearMonth}`);
    return response.data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`);
  },
};
