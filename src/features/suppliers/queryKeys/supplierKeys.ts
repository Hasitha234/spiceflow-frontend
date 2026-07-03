import { getGetSuppliersQueryKey, getGetSupplierQueryKey } from '@/api/generated';

/**
 * Domain-owned query key factory for Suppliers.
 * Provides a stable abstraction layer over Orval-generated keys,
 * allowing broad invalidation and targeted caching.
 */
export const supplierKeys = {
  /** Matches every supplier-related query for broad invalidation. */
  all: () => ['/api/v1/suppliers'] as const,

  /** Matches the paginated list query (with or without params). */
  list: (params?: Record<string, unknown>) => getGetSuppliersQueryKey(params as never),

  /** Matches a single supplier detail query. */
  detail: (id: number) => getGetSupplierQueryKey(id),
};
