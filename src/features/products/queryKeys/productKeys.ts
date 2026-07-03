import { getGetProductsQueryKey, getGetProductQueryKey } from '@/api/generated';

/**
 * Domain-owned query key factory for Products.
 * Provides a stable abstraction layer over Orval-generated keys,
 * allowing future flexibility (e.g. adding tenant-scoped keys).
 */
export const productKeys = {
  /** Matches every product-related query for broad invalidation. */
  all: () => ['/api/v1/products'] as const,

  /** Matches the paginated list query (with or without params). */
  list: (params?: Record<string, unknown>) => getGetProductsQueryKey(params as never),

  /** Matches a single product detail query. */
  detail: (id: number) => getGetProductQueryKey(id),
};
