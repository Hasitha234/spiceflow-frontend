/**
 * Query key factory for Purchase Orders feature.
 * Provides a stable abstraction over raw strings.
 */
export const purchaseOrderKeys = {
  /** Matches every PO-related query for broad invalidation. */
  all: () => ['/api/v1/purchasing'] as const,

  /** Purchasing dashboard read-model. */
  dashboard: (limit?: number) => ['/api/v1/dashboard/purchasing', { limit }] as const,

  /** PO list from the transactional API. */
  list: (params?: Record<string, unknown>) => ['/api/v1/purchasing/purchase-orders', params] as const,
};
