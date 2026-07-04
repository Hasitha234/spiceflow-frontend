import { useGetDrivers } from '@/api/generated';
import type { GetDriversParams } from '@/api/generated';
import { keepPreviousData } from '@tanstack/react-query';

/**
 * Fetches paginated driver list with server-side search and filtering.
 * Uses `placeholderData: keepPreviousData` for smooth pagination transitions.
 */
export function useDriverList(params: GetDriversParams) {
  return useGetDrivers(params, {
    query: {
      placeholderData: keepPreviousData,
    },
  });
}
