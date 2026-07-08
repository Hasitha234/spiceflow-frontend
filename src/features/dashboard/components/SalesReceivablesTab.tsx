import React from 'react';
import { Row, Col, Card, Table, Tag } from 'antd';
import { DollarOutlined, BankOutlined, WarningOutlined, TeamOutlined } from '@ant-design/icons';
import { KpiStatCard as KpiCard } from '@/components/common';
import type { SalesDashboardData, TopDebtorShop, RecentRepOrder } from '../types';

interface SalesReceivablesTabProps {
  data?: SalesDashboardData;
}

export const SalesReceivablesTab: React.FC<SalesReceivablesTabProps> = ({ data }) => {
  const formatCurr = (val?: number) =>
    val != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val) : '$0.00';

  const debtorColumns = [
    { title: 'Shop ID', dataIndex: 'shopId', key: 'shopId', width: 80 },
    { title: 'Shop Name', dataIndex: 'shopName', key: 'shopName', render: (t: string) => <strong>{t}</strong> },
    { title: 'Owner', dataIndex: 'ownerName', key: 'ownerName' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Area / Route', dataIndex: 'area', key: 'area', render: (a: string) => <Tag color="blue">{a || 'General'}</Tag> },
    {
      title: 'Outstanding Loan',
      dataIndex: 'outstandingLoan',
      key: 'outstandingLoan',
      align: 'right' as const,
      render: (v: number) => <span style={{ color: '#f87171', fontWeight: 600 }}>{formatCurr(v)}</span>,
    },
  ];

  const orderColumns = [
    { title: 'Order #', dataIndex: 'orderNumber', key: 'orderNumber', render: (t: string) => <Tag color="purple">{t}</Tag> },
    { title: 'Sales Rep', dataIndex: 'repName', key: 'repName' },
    { title: 'Order Date', dataIndex: 'orderDate', key: 'orderDate' },
    { title: 'Shops Visited', dataIndex: 'shopCount', key: 'shopCount', align: 'center' as const },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const colors: Record<string, string> = {
          SUBMITTED: 'blue',
          APPROVED: 'cyan',
          LOADED: 'orange',
          DELIVERED: 'green',
        };
        return <Tag color={colors[s] || 'default'}>{s}</Tag>;
      },
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right' as const,
      render: (v: number) => <strong style={{ color: '#34d399' }}>{formatCurr(v)}</strong>,
    },
  ];

  return (
    <div className="sales-receivables-tab">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Today's Sales"
            value={formatCurr(data?.todaySalesValue)}
            icon={<DollarOutlined />}
            iconColorClass="icon-emerald"
            badgeText="Daily Total"
            badgeType="up"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Month Sales"
            value={formatCurr(data?.monthSalesValue)}
            icon={<TeamOutlined />}
            iconColorClass="icon-purple"
            badgeText="MTD Gross"
            badgeType="up"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Month Collections"
            value={formatCurr(data?.monthCollectionsValue)}
            icon={<BankOutlined />}
            iconColorClass="icon-blue"
            badgeText="MTD Cash"
            badgeType="up"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Total Shop Debt"
            value={formatCurr(data?.totalOutstandingLoans)}
            icon={<WarningOutlined />}
            iconColorClass="icon-rose"
            badgeText="Receivables"
            badgeType="down"
          />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card className="dashboard-panel dashboard-table" title="Top Debtor Shops (Action Required)" bordered={false}>
            <Table<TopDebtorShop>
              dataSource={data?.topDebtorShops || []}
              columns={debtorColumns}
              rowKey="shopId"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="dashboard-panel dashboard-table" title="Recent Rep Orders Feed" variant="borderless">
            <Table<RecentRepOrder>
              dataSource={data?.recentOrders || []}
              columns={orderColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
