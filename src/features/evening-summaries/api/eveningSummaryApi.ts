import apiClient from '@/api/client';
import type { EveningSummaryFormValues } from '../schemas/eveningSummarySchema';

export interface EveningSummaryItemResponse {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  estimateValue: number;
}

export interface EveningSummaryResponse {
  id: number;
  tenantId: number;
  repId: number;
  repName: string;
  driverId: number;
  driverName: string;
  summaryDate: string;
  summaryNumber: string;
  finalEstimateValue: number;
  status: string;
  inventoryProcessed: boolean;
  deductionWarehouseId?: number;
  deductionWarehouseName?: string;
  items: EveningSummaryItemResponse[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
}

export interface StockAvailabilityResponse {
  productId: number;
  productName: string;
  soldQuantity: number;
  availableQuantity: number;
  shortQuantity: number;
  sufficient: boolean;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const getEveningSummaries = async (params?: Record<string, any>) => {
  const response = await apiClient.get<PageResponse<EveningSummaryResponse>>('/api/v1/sales/evening-summaries', { params });
  return response.data;
};

export const getEveningSummaryById = async (id: number) => {
  const response = await apiClient.get<EveningSummaryResponse>(`/api/v1/sales/evening-summaries/${id}`);
  return response.data;
};

export const createEveningSummary = async (data: EveningSummaryFormValues) => {
  const response = await apiClient.post<EveningSummaryResponse>('/api/v1/sales/evening-summaries', data);
  return response.data;
};

export const updateEveningSummary = async (id: number, data: EveningSummaryFormValues) => {
  const response = await apiClient.put<EveningSummaryResponse>(`/api/v1/sales/evening-summaries/${id}`, data);
  return response.data;
};

export const deleteEveningSummary = async (id: number) => {
  await apiClient.delete(`/api/v1/sales/evening-summaries/${id}`);
};

export const checkStockAvailability = async (id: number, warehouseId: number) => {
  const response = await apiClient.get<StockAvailabilityResponse[]>(`/api/v1/sales/evening-summaries/${id}/stock-check`, {
    params: { warehouseId },
  });
  return response.data;
};

export const proceedEveningSummary = async (id: number, warehouseId: number) => {
  await apiClient.post(`/api/v1/sales/evening-summaries/${id}/proceed`, { warehouseId });
};

export const undoProceedEveningSummary = async (id: number) => {
  await apiClient.post(`/api/v1/sales/evening-summaries/${id}/undo-proceed`);
};
