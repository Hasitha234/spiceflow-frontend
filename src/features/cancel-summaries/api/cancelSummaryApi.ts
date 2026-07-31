import apiClient from '@/api/client';

export const proceedCancelSummary = async (id: number, returnWarehouseId: number) => {
  await apiClient.post(`/api/v1/sales/cancel-summaries/${id}/proceed`, { returnWarehouseId });
};

export const undoProceedCancelSummary = async (id: number) => {
  await apiClient.post(`/api/v1/sales/cancel-summaries/${id}/undo-proceed`);
};
