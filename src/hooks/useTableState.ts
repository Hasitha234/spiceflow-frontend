import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface TableState {
  page: number;
  size: number;
  sort: string;
  dir: 'asc' | 'desc';
  search: string;
  filters: Record<string, string>;
}

export interface UseTableStateOptions {
  defaultSize?: number;
  defaultSort?: string;
  defaultDir?: 'asc' | 'desc';
  filterKeys?: string[];
}

/**
 * Synchronizes table state (pagination, sorting, search, filters) with URL
 * query parameters. The URL is the single source of truth — refreshing the
 * browser preserves the exact view.
 *
 * Usage:
 *   const { state, setPage, setSize, setSort, setSearch, setFilter, resetFilters } = useTableState({
 *     defaultSort: 'name',
 *     filterKeys: ['categoryId', 'supplierId'],
 *   });
 */
export function useTableState(options: UseTableStateOptions = {}) {
  const {
    defaultSize = 10,
    defaultSort = 'createdAt',
    defaultDir = 'desc',
    filterKeys = [],
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  const state: TableState = useMemo(() => {
    const filters: Record<string, string> = {};
    for (const key of filterKeys) {
      const value = searchParams.get(key);
      if (value) filters[key] = value;
    }

    return {
      page: Math.max(0, Number(searchParams.get('page') ?? 0)),
      size: Number(searchParams.get('size') ?? defaultSize),
      sort: searchParams.get('sort') ?? defaultSort,
      dir: (searchParams.get('dir') as 'asc' | 'desc') ?? defaultDir,
      search: searchParams.get('q') ?? '',
      filters,
    };
  }, [searchParams, defaultSize, defaultSort, defaultDir, filterKeys]);

  const update = useCallback(
    (patch: Partial<Record<string, string | null>>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value === null || value === '' || value === undefined) {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (page: number) => {
      if (page === state.page) return;
      update({ page: page === 0 ? null : String(page) });
    },
    [update, state.page],
  );

  const setSize = useCallback(
    (size: number) => {
      if (size === state.size) return;
      update({ size: String(size), page: null });
    },
    [update, state.size],
  );

  const setSort = useCallback(
    (field: string, direction: 'asc' | 'desc') => {
      if (field === state.sort && direction === state.dir) return;
      update({ sort: field, dir: direction, page: null });
    },
    [update, state.sort, state.dir],
  );

  const setSearch = useCallback(
    (q: string) => update({ q: q || null, page: null }),
    [update],
  );

  const setFilter = useCallback(
    (key: string, value: string | null) => update({ [key]: value, page: null }),
    [update],
  );

  const resetFilters = useCallback(() => {
    const patch: Record<string, null> = { q: null, page: null };
    for (const key of filterKeys) {
      patch[key] = null;
    }
    update(patch);
  }, [update, filterKeys]);

  /** Spring Data Pageable-compatible params for Orval hooks */
  const pageableParams = useMemo(
    () => ({
      search: state.search || undefined,
      ...Object.fromEntries(
        Object.entries(state.filters)
          .filter(([, v]) => v !== null && v !== undefined && v !== '')
          .map(([k, v]) => [k, !isNaN(Number(v)) ? Number(v) : v])
      ),
      pageable: {
        page: state.page,
        size: state.size,
        sort: [`${state.sort},${state.dir}`],
      },
    }),
    [state],
  );

  return {
    state,
    pageableParams,
    setPage,
    setSize,
    setSort,
    setSearch,
    setFilter,
    resetFilters,
  };
}
