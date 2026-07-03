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
import type { SupplierResponse } from '@/api/generated';
import { useTableState } from '@/hooks/useTableState';
import { useSupplierList } from '../hooks/useSupplierList';
import { SupplierTable } from '../components/SupplierTable';
import { SupplierFormDrawer } from '../components/SupplierFormDrawer';
import { getTraceId } from '@/utils/getProblemDetails';

export function SupplierListPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierResponse | null>(null);

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

  // Data fetching via Orval + React Query
  const { data, isLoading, isError, error, isFetching } = useSupplierList(pageableParams);

  // Filter configuration
  const filterDefs: FilterDef[] = useMemo(
    () => [
      {
        type: 'search' as const,
        key: 'q',
        placeholder: 'Search suppliers by name or tax ID...',
      },
    ],
    [],
  );

  // Map state for FilterPanel values
  const filterValues: Record<string, string> = {
    q: tableState.search,
  };

  const handleFilterChange = (key: string, value: string | null) => {
    if (key === 'q') {
      setSearch(value ?? '');
    }
  };

  const handleEdit = (supplier: SupplierResponse) => {
    setEditingSupplier(supplier);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditingSupplier(null);
  };

  // Error state with RFC 7807 traceId
  if (isError) {
    return (
      <PageLayout>
        <PageHeader
          title="Suppliers"
          breadcrumbs={[
            { title: 'Procurement', href: '/suppliers' },
            { title: 'Suppliers' },
          ]}
        />
        <ErrorState
          title="Failed to load suppliers"
          message="There was an error fetching the supplier list. Please try again."
          traceId={getTraceId(error)}
          onRetry={() => window.location.reload()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Suppliers"
        subtitle={`${data?.totalElements ?? 0} sourcing partners`}
        breadcrumbs={[
          { title: 'Procurement', href: '/suppliers' },
          { title: 'Suppliers' },
        ]}
        extra={
          <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_PURCHASING_AGENT', 'ROLE_INVENTORY_MANAGER']}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingSupplier(null);
                setDrawerOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-900/30 font-medium"
            >
              Add Supplier
            </Button>
          </PermissionGuard>
        }
      />

      <FilterPanel
        filters={filterDefs}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={resetFilters}
      />

      <SupplierTable
        data={data?.content ?? []}
        total={data?.totalElements ?? 0}
        loading={isLoading || isFetching}
        tableState={tableState}
        onPageChange={setPage}
        onSizeChange={setSize}
        onSortChange={setSort}
        onEdit={handleEdit}
      />

      <SupplierFormDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        editingSupplier={editingSupplier}
      />
    </PageLayout>
  );
}
