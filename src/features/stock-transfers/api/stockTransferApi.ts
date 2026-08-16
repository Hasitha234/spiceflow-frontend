import apiClient from '@/api/client';
import type { PageResponse } from '@/types/api';

export interface TransferHistoryResponse {
  id: number;
  warehouseId: number;
  warehouseName: string;
  productId: number;
  productName: string;
  productSku: string;
  movementType: 'TRANSFER_IN' | 'TRANSFER_OUT';
  quantity: number;
  referenceId: string;
  performedBy: string;
  timestamp: string;
}

export const stockTransferApi = {
  listTransfers: (params?: {
    warehouseId?: number | null;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }) => {
    return apiClient
      .get<PageResponse<TransferHistoryResponse>>('/api/v1/inventory/ledger/transfers', { params })
      .then((r) => r.data);
  },
};
