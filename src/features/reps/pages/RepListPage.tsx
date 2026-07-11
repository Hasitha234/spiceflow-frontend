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
import type { RepResponse } from '@/api/generated';
import { useTableState } from '@/hooks/useTableState';
import { useRepList } from '../hooks/useRepList';
import { RepTable } from '../components/RepTable';
import { RepFormDrawer } from '../components/RepFormDrawer';
import { getTraceId } from '@/utils/getProblemDetails';

export function RepListPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<RepResponse | null>(null);

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
  const repQueryParams = useMemo(() => {
    return {
      ...pageableParams,
      name: pageableParams.search || undefined,
    } as never;
  }, [pageableParams]);

  // Data fetching via Orval + React Query
  const { data, isLoading, isError, error, isFetching } = useRepList(repQueryParams);

  // Filter configuration
  const filterDefs: FilterDef[] = useMemo(
    () => [
      {
        type: 'search' as const,
        key: 'q',
        placeholder: 'Search sales reps by name or employee ID...',
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

  const handleEdit = (rep: RepResponse) => {
    setEditingRep(rep);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditingRep(null);
  };

  if (isError) {
    return (
      <PageLayout>
        <PageHeader
          title="Sales Representatives"
          breadcrumbs={[
            { title: 'Settings', href: '/settings' },
            { title: 'Sales Reps' },
          ]}
        />
        <ErrorState
          title="Failed to load sales reps"
          message="There was an error fetching the sales representatives list. Please try again."
          traceId={getTraceId(error)}
          onRetry={() => window.location.reload()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Sales Representatives"
        subtitle={`${data?.totalElements ?? 0} registered field sales agent${(data?.totalElements ?? 0) === 1 ? '' : 's'}`}
        breadcrumbs={[
          { title: 'Settings', href: '/settings' },
          { title: 'Sales Reps' },
        ]}
        extra={
          <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_SALES_MANAGER']}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRep(null);
                setDrawerOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 border-none shadow-lg shadow-blue-900/30 font-medium"
            >
              Register Sales Rep
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

      <RepTable
        data={data?.content ?? []}
        total={data?.totalElements ?? 0}
        loading={isLoading || isFetching}
        tableState={tableState}
        onPageChange={setPage}
        onSizeChange={setSize}
        onSortChange={setSort}
        onEdit={handleEdit}
      />

      <RepFormDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        editingRep={editingRep}
      />
    </PageLayout>
  );
}
