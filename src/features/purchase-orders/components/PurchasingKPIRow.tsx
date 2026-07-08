import React from 'react';
import { Col, Row } from 'antd';
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { KpiStatCard } from '@/components/common/KpiStatCard';
import type { KpiStatStatus } from '@/components/common/KpiStatCard';
import type { PurchasingDashboardData } from '../types';

interface PurchasingKPIRowProps {
  data?: PurchasingDashboardData;
  status: KpiStatStatus;
  onRetry?: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const PurchasingKPIRow: React.FC<PurchasingKPIRowProps> = ({ data, status, onRetry }) => (
  <Row gutter={[16, 16]} className="mb-5">
    <Col xs={24} sm={12} xl={6}>
      <KpiStatCard
        icon={<ShoppingCartOutlined />}
        title="Open Purchase Orders"
        value={String(data?.totalOpenOrders ?? 0)}
        footerText="across all suppliers"
        tagColor="blue"
        iconColorClass="icon-blue"
        status={status}
        onRetry={onRetry}
      />
    </Col>
    <Col xs={24} sm={12} xl={6}>
      <KpiStatCard
        icon={<RiseOutlined />}
        title="Open Order Value"
        value={fmt(data?.totalOpenOrderValue ?? 0)}
        footerText="pending fulfilment"
        tagColor="purple"
        iconColorClass="icon-purple"
        status={status}
        onRetry={onRetry}
      />
    </Col>
    <Col xs={24} sm={12} xl={6}>
      <KpiStatCard
        icon={<CheckCircleOutlined />}
        title="Received This Month"
        value={fmt(data?.totalReceivedMonthValue ?? 0)}
        footerText="goods received value"
        tagColor="green"
        iconColorClass="icon-emerald"
        status={status}
        onRetry={onRetry}
      />
    </Col>
    <Col xs={24} sm={12} xl={6}>
      <KpiStatCard
        icon={<ClockCircleOutlined />}
        title="Avg. Lead Time"
        value={`${(data?.averageSupplierLeadTimeDays ?? 0).toFixed(1)} days`}
        footerText="submit → receipt"
        tagColor="orange"
        iconColorClass="icon-amber"
        status={status}
        onRetry={onRetry}
      />
    </Col>
  </Row>
);
