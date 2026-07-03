import { useGetReps } from '@/api/generated';

/**
 * Fetches lookup data needed for Shop forms (e.g. Sales Reps for assignment).
 * Fetches up to 500 reps for dropdown selection.
 */
export function useShopLookups() {
  const repsQuery = useGetReps({
    pageable: { page: 0, size: 500 },
  });

  return {
    reps: repsQuery.data?.content ?? [],
    isLoading: repsQuery.isLoading,
  };
}
