import React from 'react';
import { Row, Col, Card, Table, Tag } from 'antd';
import { FileTextOutlined, DollarOutlined, ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { KpiStatCard as KpiCard } from '@/components/common';
import type { PurchasingDashboardData, SupplierLeadTime, OpenPurchaseOrderProjection } from '@/features/purchase-orders/types';

interface PurchasingSuppliersTabProps {
  data?: PurchasingDashboardData;
}

export const PurchasingSuppliersTab: React.FC<PurchasingSuppliersTabProps> = ({ data }) => {
  const formatCurr = (val?: number) =>
    val != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val) : '$0.00';

  const leadTimeColumns = [
    { title: 'Supplier ID', dataIndex: 'supplierId', key: 'supplierId', width: 90 },
    { title: 'Supplier Name', dataIndex: 'supplierName', key: 'supplierName', render: (t: string) => <strong>{t}</strong> },
    { title: 'Total POs', dataIndex: 'totalOrders', key: 'totalOrders', align: 'center' as const },
    { title: 'Completed POs', dataIndex: 'completedOrders', key: 'completedOrders', align: 'center' as const },
    {
      title: 'Avg Lead Time',
      dataIndex: 'averageLeadTimeDays',
      key: 'averageLeadTimeDays',
      align: 'right' as const,
      render: (days: number) => (
        <span style={{ color: days > 14 ? '#f87171' : days > 7 ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
          {days != null ? `${days.toFixed(1)} days` : 'N/A'}
        </span>
      ),
    },
  ];

  const poColumns = [
    { title: 'PO #', dataIndex: 'poNumber', key: 'poNumber', render: (t: string) => <Tag color="amber">{t}</Tag> },
    { title: 'Supplier', dataIndex: 'supplierName', key: 'supplierName' },
    { title: 'Order Date', dataIndex: 'orderDate', key: 'orderDate' },
    {
      title: 'Age (Days)',
      dataIndex: 'ageInDays',
      key: 'ageInDays',
      align: 'center' as const,
      render: (age: number) => (
        <span style={{ color: age > 30 ? '#f87171' : '#e6edf3', fontWeight: age > 30 ? 700 : 400 }}>
          {age} days
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const colors: Record<string, string> = {
          SUBMITTED: 'blue',
          APPROVED: 'cyan',
          ORDERED: 'orange',
          PARTIALLY_RECEIVED: 'purple',
        };
        return <Tag color={colors[s] || 'default'}>{s}</Tag>;
      },
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right' as const,
      render: (v: number) => <strong style={{ color: '#fbbf24' }}>{formatCurr(v)}</strong>,
    },
  ];

  return (
    <div className="purchasing-suppliers-tab">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Open PO Value"
            value={formatCurr(data?.totalOpenOrderValue)}
            icon={<DollarOutlined />}
            iconColorClass="icon-amber"
            badgeText="Unpaid POs"
            badgeType="neutral"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Open Orders Count"
            value={data?.totalOpenOrders || 0}
            icon={<FileTextOutlined />}
            iconColorClass="icon-blue"
            badgeText="In Progress"
            badgeType="neutral"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Month Received Value"
            value={formatCurr(data?.totalReceivedMonthValue)}
            icon={<SyncOutlined />}
            iconColorClass="icon-emerald"
            badgeText="MTD Receipts"
            badgeType="up"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Avg Lead Time"
            value={`${data?.averageSupplierLeadTimeDays != null ? data.averageSupplierLeadTimeDays.toFixed(1) : '0'} Days`}
            icon={<ClockCircleOutlined />}
            iconColorClass="icon-purple"
            badgeText="Supplier Speed"
            badgeType={(data?.averageSupplierLeadTimeDays || 0) <= 7 ? 'up' : 'down'}
          />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={11}>
          <Card className="dashboard-panel dashboard-table" title="Supplier Lead Time Performance" variant="borderless">
            <Table<SupplierLeadTime>
              dataSource={data?.supplierLeadTimes || []}
              columns={leadTimeColumns}
              rowKey="supplierId"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={13}>
          <Card className="dashboard-panel dashboard-table" title="Recent Open Purchase Orders" variant="borderless">
            <Table<OpenPurchaseOrderProjection>
              dataSource={data?.recentOpenOrders || []}
              columns={poColumns}
              rowKey="poNumber"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
