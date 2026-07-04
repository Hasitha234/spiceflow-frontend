import apiClient from '@/api/client';
import type { PurchasingDashboardData } from '../types';

/**
 * Fetches the CQRS read-model projection for the Purchasing Dashboard.
 * Calls GET /api/v1/dashboard/purchasing — bypasses Orval until next regen.
 */
export async function fetchPurchasingDashboard(limit = 10): Promise<PurchasingDashboardData> {
  const { data } = await apiClient.get<PurchasingDashboardData>('/api/v1/dashboard/purchasing', {
    params: { limit },
  });
  return data;
}
