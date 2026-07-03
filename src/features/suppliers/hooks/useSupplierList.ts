import { useGetSuppliers } from '@/api/generated';
import type { GetSuppliersParams } from '@/api/generated';
import { keepPreviousData } from '@tanstack/react-query';

/**
 * Fetches paginated supplier list with server-side search, sorting, and filtering.
 * Uses `placeholderData: keepPreviousData` for smooth pagination transitions
 * (no flicker between pages).
 */
export function useSupplierList(params: GetSuppliersParams) {
  return useGetSuppliers(params, {
    query: {
      placeholderData: keepPreviousData,
    },
  });
}
