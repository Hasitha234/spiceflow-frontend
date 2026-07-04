import { useGetShops } from '@/api/generated';
import type { GetShopsParams } from '@/api/generated';
import { keepPreviousData } from '@tanstack/react-query';

/**
 * Fetches paginated shop list with server-side search and filtering.
 * Uses `placeholderData: keepPreviousData` for smooth pagination transitions.
 */
export function useShopList(params: GetShopsParams) {
  return useGetShops(params, {
    query: {
      placeholderData: keepPreviousData,
    },
  });
}
