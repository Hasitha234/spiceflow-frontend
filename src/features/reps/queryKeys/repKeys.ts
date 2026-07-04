import { getGetRepsQueryKey, getGetRepQueryKey } from '@/api/generated';

/**
 * Domain-owned query key factory for Sales Representatives.
 * Provides a stable abstraction layer over Orval-generated keys,
 * allowing broad invalidation and targeted caching.
 */
export const repKeys = {
  /** Matches every rep-related query for broad invalidation. */
  all: () => ['/api/v1/sales/master-data/reps'] as const,

  /** Matches the paginated list query (with or without params). */
  list: (params?: Record<string, unknown>) => getGetRepsQueryKey(params as never),

  /** Matches a single rep detail query. */
  detail: (id: number) => getGetRepQueryKey(id),
};
