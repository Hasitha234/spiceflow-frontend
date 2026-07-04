import { useQuery } from '@tanstack/react-query';
import { fetchPurchasingDashboard } from '../api/dashboardApi';
import { purchaseOrderKeys } from '../queryKeys/purchaseOrderKeys';

/**
 * Fetches the Purchasing Dashboard CQRS projection.
 * Stale time: 2 minutes — dashboards are near-real-time, not instant.
 */
export function usePurchasingDashboard(limit = 10) {
  return useQuery({
    queryKey: purchaseOrderKeys.dashboard(limit),
    queryFn: () => fetchPurchasingDashboard(limit),
    staleTime: 2 * 60 * 1000,
  });
}
