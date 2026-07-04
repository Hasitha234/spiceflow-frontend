import { useQuery } from '@tanstack/react-query';
import {
  fetchInventoryDashboard,
  fetchLogisticsDashboard,
  fetchSalesDashboard,
  fetchFinanceDashboard,
} from '../api/dashboardApi';
import { fetchPurchasingDashboard } from '@/features/purchase-orders/api/dashboardApi';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  inventory: (limit: number) => [...dashboardKeys.all, 'inventory', limit] as const,
  logistics: (limit: number) => [...dashboardKeys.all, 'logistics', limit] as const,
  sales: (limit: number) => [...dashboardKeys.all, 'sales', limit] as const,
  finance: (limit: number) => [...dashboardKeys.all, 'finance', limit] as const,
  purchasing: (limit: number) => [...dashboardKeys.all, 'purchasing', limit] as const,
};

const STALE_TIME = 2 * 60 * 1000; // 2 minutes

export function useInventoryDashboard(limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.inventory(limit),
    queryFn: () => fetchInventoryDashboard(limit),
    staleTime: STALE_TIME,
  });
}

export function useLogisticsDashboard(limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.logistics(limit),
    queryFn: () => fetchLogisticsDashboard(limit),
    staleTime: STALE_TIME,
  });
}

export function useSalesDashboard(limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.sales(limit),
    queryFn: () => fetchSalesDashboard(limit),
    staleTime: STALE_TIME,
  });
}

export function useFinanceDashboard(limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.finance(limit),
    queryFn: () => fetchFinanceDashboard(limit),
    staleTime: STALE_TIME,
  });
}

export function usePurchasingDashboard(limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.purchasing(limit),
    queryFn: () => fetchPurchasingDashboard(limit),
    staleTime: STALE_TIME,
  });
}
