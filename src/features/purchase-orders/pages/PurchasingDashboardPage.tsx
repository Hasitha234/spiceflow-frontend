import { useState } from 'react';
import { Button, Col, Row } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import {
  PageLayout,
  PageHeader,
} from '@/components/common';
import { usePurchasingDashboard } from '../hooks/usePurchasingDashboard';
import {
  PurchasingKPIRow,
  AgingBucketChart,
  SupplierLeadTimeTable,
  OpenOrdersTable,
} from '../components';

/**
 * Purchasing Dashboard page — CQRS read-model projection.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────┐
 *   │  KPI Row (4 cards)                          │
 *   ├──────────────────┬──────────────────────────┤
 *   │  Aging Buckets   │  Supplier Lead Times     │
 *   ├──────────────────┴──────────────────────────┤
 *   │  Recent Open Orders (table)                 │
 *   └─────────────────────────────────────────────┘
 */
export function PurchasingDashboardPage() {
  const [limit] = useState(10);
  const { data, isLoading, isError, refetch, isFetching } = usePurchasingDashboard(limit);

  const status = isError ? 'error' : (isLoading || isFetching) ? 'loading' : 'success';

  return (
    <PageLayout>
      <PageHeader
        title="Purchasing Dashboard"
        subtitle="Real-time procurement analytics"
        breadcrumbs={[
          { title: 'Purchasing', href: '/purchase-orders' },
          { title: 'Dashboard' },
        ]}
        extra={
          <Button
            icon={<ReloadOutlined spin={isFetching} />}
            onClick={() => void refetch()}
            disabled={isFetching}
            className="!border-slate-600 !text-slate-300 hover:!border-slate-400"
          >
            Refresh
          </Button>
        }
      />

      {/* KPI Row */}
      <PurchasingKPIRow data={data} status={status} onRetry={() => void refetch()} />

      {/* Aging + Lead Time side by side */}
      <Row gutter={[16, 16]} className="mb-5">
        <Col xs={24} lg={10}>
          <AgingBucketChart
            buckets={data?.agingBuckets ?? []}
            status={status}
          />
        </Col>
        <Col xs={24} lg={14}>
          <SupplierLeadTimeTable
            data={data?.supplierLeadTimes ?? []}
            status={status}
          />
        </Col>
      </Row>

      {/* Recent Open Orders */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Recent Open Orders
          </h3>
          <span className="text-xs text-slate-500">
            Showing latest {data?.recentOpenOrders?.length ?? 0} open orders
          </span>
        </div>
        <OpenOrdersTable
          data={data?.recentOpenOrders ?? []}
          status={status}
        />
      </div>
    </PageLayout>
  );
}
