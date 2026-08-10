import apiClient from '@/api/client';

export const proceedCancelSummary = async (id: number, returnWarehouseId: number) => {
  await apiClient.post(`/api/v1/sales/cancel-summaries/${id}/proceed`, { returnWarehouseId });
};

export const undoProceedCancelSummary = async (id: number) => {
  await apiClient.post(`/api/v1/sales/cancel-summaries/${id}/undo-proceed`);
};

export const updateCancelSummary = async (id: number, data: import('../schemas/cancelSummarySchema').CancelSummaryFormData) => {
  const response = await apiClient.put(`/api/v1/sales/cancel-summaries/${id}`, {
    ...data
  });
  return response.data;
};

export const getCancelSummaryById = async (id: number) => {
  const response = await apiClient.get<import('@/api/generated').CancelSummaryResponse>(`/api/v1/sales/cancel-summaries/${id}`);
  return response.data;
};

export const deleteCancelSummary = async (id: number) => {
  await apiClient.delete(`/api/v1/sales/cancel-summaries/${id}`);
};
