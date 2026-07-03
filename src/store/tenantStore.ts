import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Tenant store — the selected tenant ID is persisted to localStorage because
 * it is not sensitive (it's already embedded in the JWT and visible in API paths).
 * Persisting it across hard refreshes gives a better UX.
 *
 * Note: React Query cache keys must include tenantId so that switching tenants
 * invalidates all stale cached data immediately.
 */
interface TenantState {
  tenantId: number | null;
  setTenantId: (id: number | null) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      tenantId: null,
      setTenantId: (id) => set({ tenantId: id }),
    }),
    { name: 'sf_tenant' },
  ),
);
