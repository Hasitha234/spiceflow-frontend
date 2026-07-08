import React from 'react';
import { Row, Col, Card } from 'antd';
import {
  DollarOutlined,
  BankOutlined,
  RiseOutlined,
  InboxOutlined,
  CarOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { KpiStatCard } from '@/components/common/KpiStatCard';
import type {
  InventoryDashboardData,
  LogisticsDashboardData,
  SalesDashboardData,
  FinanceDashboardData,
} from '../types';
import type { PurchasingDashboardData } from '@/features/purchase-orders/types';

interface ExecutiveOverviewTabProps {
  inventory?: InventoryDashboardData;
  logistics?: LogisticsDashboardData;
  sales?: SalesDashboardData;
  finance?: FinanceDashboardData;
  purchasing?: PurchasingDashboardData;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

const COLORS = ['#10b981', '#60a5fa', '#fbbf24', '#f87171'];

export const ExecutiveOverviewTab: React.FC<ExecutiveOverviewTabProps> = ({
  inventory,
  logistics,
  sales,
  finance,
  purchasing,
  loading,
  error,
  onRetry,
}) => {
  const formatCurr = (val?: number) =>
    val != null
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
      : '$0';

  const barData = [
    {
      name: 'Current Month',
      Sales: sales?.monthSalesValue || 0,
      Collections: finance?.totalCollectionsMonth || 0,
      Purchasing: purchasing?.totalReceivedMonthValue || 0,
    },
  ];

  const pieData = (finance?.receivablesAgingBuckets || []).map((b) => ({
    name: b.bucketLabel,
    value: Number(b.totalAmount) || 0,
  }));

  const kpiStatus = error ? 'error' : loading ? 'loading' : 'success';

  return (
    <div className="executive-overview">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <KpiStatCard
            title="Today's Sales"
            value={formatCurr(sales?.todaySalesValue)}
            icon={<DollarOutlined />}
            iconColorClass="icon-emerald"
            badgeText="Live Feed"
            badgeType="up"
            footerText="Updated just now"
            status={kpiStatus}
            onRetry={onRetry}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiStatCard
            title="Month Collections"
            value={formatCurr(finance?.totalCollectionsMonth)}
            icon={<BankOutlined />}
            iconColorClass="icon-blue"
            badgeText="Inflows"
            badgeType="up"
            footerText="Confirmed cash & cheques"
            status={kpiStatus}
            onRetry={onRetry}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiStatCard
            title="Net Cash Flow"
            value={formatCurr(finance?.netCashFlowMonth)}
            icon={<RiseOutlined />}
            iconColorClass="icon-purple"
            badgeText="Month Net"
            badgeType={((finance?.netCashFlowMonth || 0) >= 0) ? 'up' : 'down'}
            footerText="Collections vs PO spend"
            status={kpiStatus}
            onRetry={onRetry}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiStatCard
            title="Total Stock Value"
            value={formatCurr(inventory?.totalStockValue)}
            icon={<InboxOutlined />}
            iconColorClass="icon-amber"
            badgeText={`${inventory?.totalItemsCount || 0} SKUs`}
            badgeType="neutral"
            footerText="Warehouse valuation"
            status={kpiStatus}
            onRetry={onRetry}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <KpiStatCard
            title="Active Loading Sheets"
            value={logistics?.activeLoadingSheetsCount || 0}
            icon={<CarOutlined />}
            iconColorClass="icon-emerald"
            badgeText="In Transit"
            badgeType="up"
            footerText="Lorries being loaded/dispatched"
            status={kpiStatus}
            onRetry={onRetry}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiStatCard
            title="In-Progress Deliveries"
            value={logistics?.inProgressDeliveriesCount || 0}
            icon={<ShoppingCartOutlined />}
            iconColorClass="icon-blue"
            badgeText="Active Routes"
            badgeType="neutral"
            footerText="Shops currently visited"
            status={kpiStatus}
            onRetry={onRetry}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiStatCard
            title="Total Receivables"
            value={formatCurr(finance?.totalReceivables)}
            icon={<WarningOutlined />}
            iconColorClass="icon-rose"
            badgeText="Debtors"
            badgeType="down"
            footerText="Unpaid shop loans"
            status={kpiStatus}
            onRetry={onRetry}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiStatCard
            title="Open PO Payables"
            value={formatCurr(purchasing?.totalOpenOrderValue)}
            icon={<FileTextOutlined />}
            iconColorClass="icon-amber"
            badgeText={`${purchasing?.totalOpenOrders || 0} POs`}
            badgeType="neutral"
            footerText="Pending supplier bills"
            status={kpiStatus}
            onRetry={onRetry}
          />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card className="dashboard-panel" title="Monthly Financial Overview ($)" variant="borderless">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#8b949e" />
                  <YAxis stroke="#8b949e" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1c2333', borderColor: '#30363d', borderRadius: '8px', color: '#e6edf3' }}
                  />
                  <Legend />
                  <Bar dataKey="Sales" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Collections" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Purchasing" fill="#fbbf24" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="dashboard-panel" title="Receivables Aging Breakdown" variant="borderless">
            <div className="chart-container">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: unknown) => [formatCurr(typeof val === 'number' ? val : Number(val) || 0), 'Amount']}
                      contentStyle={{ backgroundColor: '#1c2333', borderColor: '#30363d', borderRadius: '8px', color: '#e6edf3' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b949e' }}>
                  No outstanding receivables data
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
