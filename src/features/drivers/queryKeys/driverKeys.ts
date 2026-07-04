import { getGetDriversQueryKey, getGetDriverQueryKey } from '@/api/generated';

/**
 * Domain-owned query key factory for Drivers.
 * Provides a stable abstraction layer over Orval-generated keys,
 * allowing broad invalidation and targeted caching.
 */
export const driverKeys = {
  /** Matches every driver-related query for broad invalidation. */
  all: () => ['/api/v1/sales/master-data/drivers'] as const,

  /** Matches the paginated list query (with or without params). */
  list: (params?: Record<string, unknown>) => getGetDriversQueryKey(params as never),

  /** Matches a single driver detail query. */
  detail: (id: number) => getGetDriverQueryKey(id),
};
