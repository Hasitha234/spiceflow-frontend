import { useGetAllWarehouses } from '@/api/generated';

/**
 * Loads lookup data (warehouses) needed by the DriverForm.
 * Keeps the form component presentation-focused by lifting data-fetching
 * into this dedicated hook.
 */
export function useDriverLookups() {
  const warehousesQuery = useGetAllWarehouses(
    { pageable: { page: 0, size: 200 } },
  );

  const warehouseOptions = (warehousesQuery.data?.content ?? []).map((w) => ({
    label: w.location ? `${w.name ?? ''} (${w.location})` : (w.name ?? ''),
    value: w.id ?? 0,
  }));

  const isLoading = warehousesQuery.isLoading;

  return {
    warehouseOptions,
    isLoading,
  };
}
