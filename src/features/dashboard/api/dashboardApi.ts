import apiClient from '@/api/client';
import type {
  InventoryDashboardData,
  LogisticsDashboardData,
  SalesDashboardData,
  FinanceDashboardData,
} from '../types';

export async function fetchInventoryDashboard(limit = 10): Promise<InventoryDashboardData> {
  const { data } = await apiClient.get<InventoryDashboardData>('/api/v1/dashboard/inventory', {
    params: { limit },
  });
  return data;
}

export async function fetchLogisticsDashboard(limit = 10): Promise<LogisticsDashboardData> {
  const { data } = await apiClient.get<LogisticsDashboardData>('/api/v1/dashboard/logistics', {
    params: { limit },
  });
  return data;
}

export async function fetchSalesDashboard(limit = 10): Promise<SalesDashboardData> {
  const { data } = await apiClient.get<SalesDashboardData>('/api/v1/dashboard/sales', {
    params: { limit },
  });
  return data;
}

export async function fetchFinanceDashboard(limit = 10): Promise<FinanceDashboardData> {
  const { data } = await apiClient.get<FinanceDashboardData>('/api/v1/dashboard/finance', {
    params: { limit },
  });
  return data;
}
