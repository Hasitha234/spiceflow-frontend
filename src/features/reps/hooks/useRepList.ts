import { useGetReps } from '@/api/generated';
import type { GetRepsParams } from '@/api/generated';
import { keepPreviousData } from '@tanstack/react-query';

/**
 * Fetches paginated sales representative list with server-side search and filtering.
 * Uses `placeholderData: keepPreviousData` for smooth pagination transitions.
 */
export function useRepList(params: GetRepsParams) {
  return useGetReps(params, {
    query: {
      placeholderData: keepPreviousData,
    },
  });
}
