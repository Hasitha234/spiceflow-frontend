import React from 'react';
import { Col, Row, Skeleton } from 'antd';
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import type { PurchasingDashboardData } from '../types';

interface KPICardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  accent: string;
  loading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ icon, title, value, subtitle, accent, loading }) => (
  <div
    className={`relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50 backdrop-blur-sm p-5 shadow-lg transition-all duration-200 hover:border-slate-600 hover:shadow-xl hover:bg-slate-800/70`}
  >
    <div className={`absolute top-0 left-0 h-0.5 w-full ${accent}`} />
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 120 }} />
        ) : (
          <p className="text-2xl font-bold text-slate-100 tabular-nums truncate">{value}</p>
        )}
        {subtitle && !loading && (
          <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg ${accent.replace('bg-gradient-to-r from-', '!bg-').replace(' to-', '/20 text-')}-300`}>
        {icon}
      </div>
    </div>
  </div>
);

interface PurchasingKPIRowProps {
  data?: PurchasingDashboardData;
  loading: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const PurchasingKPIRow: React.FC<PurchasingKPIRowProps> = ({ data, loading }) => (
  <Row gutter={[16, 16]} className="mb-5">
    <Col xs={24} sm={12} xl={6}>
      <KPICard
        icon={<ShoppingCartOutlined />}
        title="Open Purchase Orders"
        value={loading ? '—' : String(data?.totalOpenOrders ?? 0)}
        subtitle="across all suppliers"
        accent="bg-gradient-to-r from-blue-500 to-blue-600"
        loading={loading}
      />
    </Col>
    <Col xs={24} sm={12} xl={6}>
      <KPICard
        icon={<RiseOutlined />}
        title="Open Order Value"
        value={loading ? '—' : fmt(data?.totalOpenOrderValue ?? 0)}
        subtitle="pending fulfilment"
        accent="bg-gradient-to-r from-violet-500 to-violet-600"
        loading={loading}
      />
    </Col>
    <Col xs={24} sm={12} xl={6}>
      <KPICard
        icon={<CheckCircleOutlined />}
        title="Received This Month"
        value={loading ? '—' : fmt(data?.totalReceivedMonthValue ?? 0)}
        subtitle="goods received value"
        accent="bg-gradient-to-r from-emerald-500 to-emerald-600"
        loading={loading}
      />
    </Col>
    <Col xs={24} sm={12} xl={6}>
      <KPICard
        icon={<ClockCircleOutlined />}
        title="Avg. Lead Time"
        value={loading ? '—' : `${(data?.averageSupplierLeadTimeDays ?? 0).toFixed(1)} days`}
        subtitle="submit → receipt"
        accent="bg-gradient-to-r from-amber-500 to-amber-600"
        loading={loading}
      />
    </Col>
  </Row>
);
