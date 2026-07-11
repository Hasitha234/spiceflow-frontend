import { useMemo, useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  PageLayout,
  PageHeader,
  FilterPanel,
  ErrorState,
  PermissionGuard,
} from '@/components/common';
import type { FilterDef } from '@/components/common';
import type { ShopResponse } from '@/api/generated';
import { useTableState } from '@/hooks/useTableState';
import { useShopList } from '../hooks/useShopList';
import { ShopTable } from '../components/ShopTable';
import { ShopFormDrawer } from '../components/ShopFormDrawer';
import { getTraceId } from '@/utils/getProblemDetails';

export function ShopListPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<ShopResponse | null>(null);

  // URL ↔ table state synchronization
  const {
    state: tableState,
    pageableParams,
    setPage,
    setSize,
    setSort,
    setSearch,
    resetFilters,
  } = useTableState({
    defaultSort: 'name',
    defaultDir: 'asc',
  });

  // Map search param to API `name` query parameter
  const shopQueryParams = useMemo(() => {
    return {
      ...pageableParams,
      name: pageableParams.search || undefined,
    };
  }, [pageableParams]);

  // Data fetching via Orval + React Query
  const { data, isLoading, isError, error, isFetching } = useShopList(shopQueryParams);

  // Filter configuration
  const filterDefs: FilterDef[] = useMemo(
    () => [
      {
        type: 'search' as const,
        key: 'q',
        placeholder: 'Search shops by name, route, or area...',
      },
    ],
    [],
  );

  const filterValues: Record<string, string> = {
    q: tableState.search,
  };

  const handleFilterChange = (key: string, value: string | null) => {
    if (key === 'q') {
      setSearch(value ?? '');
    }
  };

  const handleEdit = (shop: ShopResponse) => {
    setEditingShop(shop);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditingShop(null);
  };

  if (isError) {
    return (
      <PageLayout>
        <PageHeader
          title="Shops & Customers"
          breadcrumbs={[
            { title: 'Distribution', href: '/shops' },
            { title: 'Shops' },
          ]}
        />
        <ErrorState
          title="Failed to load shops"
          message="There was an error fetching the shops list. Please try again."
          traceId={getTraceId(error)}
          onRetry={() => window.location.reload()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Shops & Customers"
        subtitle={`${data?.totalElements ?? 0} registered customer location${(data?.totalElements ?? 0) === 1 ? '' : 's'}`}
        breadcrumbs={[
          { title: 'Distribution', href: '/shops' },
          { title: 'Shops' },
        ]}
        extra={
          <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_SALES_MANAGER', 'ROLE_SALES_REP']}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingShop(null);
                setDrawerOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-900/30 font-medium"
            >
              Register Shop
            </Button>
          </PermissionGuard>
        }
      />

      {(data?.totalElements ?? 0) > 0 && (
        <FilterPanel
          filters={filterDefs}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={resetFilters}
        />
      )}

      <ShopTable
        data={data?.content ?? []}
        total={data?.totalElements ?? 0}
        loading={isLoading || isFetching}
        tableState={tableState}
        onPageChange={setPage}
        onSizeChange={setSize}
        onSortChange={setSort}
        onEdit={handleEdit}
      />

      <ShopFormDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        editingShop={editingShop}
      />
    </PageLayout>
  );
}
