import { useGetCategories, useGetSuppliers } from '@/api/generated';

/**
 * Loads lookup data (categories, suppliers) needed by the ProductForm.
 * Keeps the form component presentation-focused by lifting data-fetching
 * into this dedicated hook.
 */
export function useProductLookups() {
  const categoriesQuery = useGetCategories(
    { pageable: { page: 0, size: 200 } },
  );

  const suppliersQuery = useGetSuppliers(
    { pageable: { page: 0, size: 200 } },
  );

  const categoryOptions = (categoriesQuery.data?.content ?? []).map((c) => ({
    label: c.name ?? '',
    value: c.id ?? 0,
  }));

  const supplierOptions = (suppliersQuery.data?.content ?? []).map((s) => ({
    label: s.name ?? '',
    value: s.id ?? 0,
  }));

  const isLoading = categoriesQuery.isLoading || suppliersQuery.isLoading;

  return {
    categoryOptions,
    supplierOptions,
    isLoading,
  };
}
