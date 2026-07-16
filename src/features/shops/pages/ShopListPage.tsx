import { useMemo, useState } from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  PageLayout,
  PageHeader,
  ErrorState,
  PermissionGuard,
} from '@/components/common';
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
        subtitle={`${data?.totalElements ?? 0} registered shop${(data?.totalElements ?? 0) === 1 ? '' : 's'}`}
        extra={
          <div className="flex items-center gap-3">
            {(data?.totalElements ?? 0) > 0 && (
              <Input.Search
                placeholder="Search shops..."
                value={tableState.search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
                style={{ width: 280 }}
              />
            )}
            <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_SALES_MANAGER', 'ROLE_SALES_REP']}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingShop(null);
                  setDrawerOpen(true);
                }}
                className="font-medium"
              >
                Register Shop
              </Button>
            </PermissionGuard>
          </div>
        }
      />



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
