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
import type { DriverResponse } from '@/api/generated';
import { useTableState } from '@/hooks/useTableState';
import { useDriverList } from '../hooks/useDriverList';
import { DriverTable } from '../components/DriverTable';
import { DriverFormDrawer } from '../components/DriverFormDrawer';
import { getTraceId } from '@/utils/getProblemDetails';

export function DriverListPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverResponse | null>(null);

  // URL Γåö table state synchronization
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
  const driverQueryParams = useMemo(() => {
    return {
      ...pageableParams,
      name: pageableParams.search || undefined,
    } as never;
  }, [pageableParams]);

  // Data fetching via Orval + React Query
  const { data, isLoading, isError, error, isFetching } = useDriverList(driverQueryParams);

  // Filter configuration
  const filterDefs: FilterDef[] = useMemo(
    () => [
      {
        type: 'search' as const,
        key: 'q',
        placeholder: 'Search drivers by name, ID, or license...',
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

  const handleEdit = (driver: DriverResponse) => {
    setEditingDriver(driver);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditingDriver(null);
  };

  if (isError) {
    return (
      <PageLayout>
        <PageHeader
          title="Drivers & Logistics"
          breadcrumbs={[
            { title: 'Settings', href: '/settings' },
            { title: 'Drivers' },
          ]}
        />
        <ErrorState
          title="Failed to load drivers"
          message="There was an error fetching the delivery drivers list. Please try again."
          traceId={getTraceId(error)}
          onRetry={() => window.location.reload()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Drivers & Logistics"
        subtitle={`${data?.totalElements ?? 0} registered delivery drivers and fleet personnel`}
        breadcrumbs={[
          { title: 'Settings', href: '/settings' },
          { title: 'Drivers' },
        ]}
        extra={
          <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_SALES_MANAGER', 'ROLE_INVENTORY_MANAGER']}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingDriver(null);
                setDrawerOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 border-none shadow-lg shadow-blue-900/30 font-medium"
            >
              Register Driver
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

      <DriverTable
        data={data?.content ?? []}
        total={data?.totalElements ?? 0}
        loading={isLoading || isFetching}
        tableState={tableState}
        onPageChange={setPage}
        onSizeChange={setSize}
        onSortChange={setSort}
        onEdit={handleEdit}
      />

      <DriverFormDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        editingDriver={editingDriver}
      />
    </PageLayout>
  );
}
