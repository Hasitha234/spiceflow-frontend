import { useGetProducts } from '@/api/generated';
import type { GetProductsParams } from '@/api/generated';
import { keepPreviousData } from '@tanstack/react-query';

/**
 * Fetches paginated product list with server-side search, sorting, and filtering.
 * Uses `placeholderData: keepPreviousData` for smooth pagination transitions
 * (no flicker between pages).
 */
export function useProductList(params: GetProductsParams) {
  return useGetProducts(params, {
    query: {
      placeholderData: keepPreviousData,
    },
  });
}
