import apiClient from '@/api/client';
import type { BillFormData } from '../schemas/billSchema';
import type { BillResponse } from '@/api/generated';

export const updateBill = async (id: number, data: BillFormData) => {
  const response = await apiClient.put<BillResponse>(`/api/v1/bills/${id}`, data);
  return response.data;
};

export const getBillById = async (id: number) => {
  const response = await apiClient.get<BillResponse>(`/api/v1/bills/${id}`);
  return response.data;
};
