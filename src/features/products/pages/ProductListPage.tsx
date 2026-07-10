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
import type { ProductResponse } from '@/api/generated';
import { useTableState } from '@/hooks/useTableState';
import { useProductList } from '../hooks/useProductList';
import { useProductLookups } from '../hooks/useProductLookups';
import { ProductTable } from '../components/ProductTable';
import { ProductFormDrawer } from '../components/ProductFormDrawer';
import { getTraceId } from '@/utils/getProblemDetails';
import { pluralize } from '@/utils/pluralize';

const FILTER_KEYS = ['supplierId'];

export function ProductListPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);

  // URL ↔ table state synchronization
  const {
    state: tableState,
    pageableParams,
    setPage,
    setSize,
    setSort,
    setSearch,
    setFilter,
    resetFilters,
  } = useTableState({
    defaultSort: 'name',
    defaultDir: 'asc',
    filterKeys: FILTER_KEYS,
  });

  // Data fetching via Orval + React Query
  const { data, isLoading, isError, error, isFetching } = useProductList(pageableParams);

  // Lookups for filter dropdowns
  const { supplierOptions } = useProductLookups();

  // Filter configuration
  const filterDefs: FilterDef[] = useMemo(
    () => [
      {
        type: 'search' as const,
        key: 'q',
        placeholder: 'Search products by name or SKU...',
      },
      {
        type: 'select' as const,
        key: 'supplierId',
        label: 'Supplier',
        placeholder: 'All Suppliers',
        options: supplierOptions.map((o) => ({ ...o, value: String(o.value) })),
      },
    ],
    [supplierOptions],
  );

  // Map state for FilterPanel values
  const filterValues: Record<string, string> = {
    q: tableState.search,
    ...tableState.filters,
  };

  const handleFilterChange = (key: string, value: string | null) => {
    if (key === 'q') {
      setSearch(value ?? '');
    } else {
      setFilter(key, value);
    }
  };

  const handleEdit = (product: ProductResponse) => {
    setEditingProduct(product);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditingProduct(null);
  };

  // Error state with RFC 7807 traceId
  if (isError) {
    return (
      <PageLayout>
        <PageHeader
          title="Products"
          breadcrumbs={[
            { title: 'Settings', href: '/settings' },
            { title: 'Products' },
          ]}
        />
        <ErrorState
          title="Failed to load products"
          message="There was an error fetching the product list. Please try again."
          traceId={getTraceId(error)}
          onRetry={() => window.location.reload()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Products"
        subtitle={`${data?.totalElements ?? 0} ${pluralize(data?.totalElements ?? 0, 'product')}`}
        breadcrumbs={[
          { title: 'Settings', href: '/settings' },
          { title: 'Products' },
        ]}
        extra={
          <PermissionGuard requirePermission="SETTINGS_PRODUCTS">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingProduct(null);
                setDrawerOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-900/30 font-medium"
            >
              Add Product
            </Button>
          </PermissionGuard>
        }
      />

      {/* MAIN DATA CONTAINER */}
      <div style={{ 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--surface-border)', 
        overflow: 'hidden', 
        background: 'var(--surface-raised)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <FilterPanel
          filters={filterDefs}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={resetFilters}
        />

        <ProductTable
          data={data?.content ?? []}
          total={data?.totalElements ?? 0}
          loading={isLoading || isFetching}
          tableState={tableState}
          onPageChange={setPage}
          onSizeChange={setSize}
          onSortChange={setSort}
          onEdit={handleEdit}
        />
      </div>

      <ProductFormDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        editingProduct={editingProduct}
      />
    </PageLayout>
  );
}
