import { getGetShopsQueryKey, getGetShopQueryKey } from '@/api/generated';

/**
 * Domain-owned query key factory for Shops.
 * Provides a stable abstraction layer over Orval-generated keys,
 * allowing broad invalidation and targeted caching.
 */
export const shopKeys = {
  /** Matches every shop-related query for broad invalidation. */
  all: () => ['/api/v1/sales/master-data/shops'] as const,

  /** Matches the paginated list query (with or without params). */
  list: (params?: Record<string, unknown>) => getGetShopsQueryKey(params as never),

  /** Matches a single shop detail query. */
  detail: (id: number) => getGetShopQueryKey(id),
};
