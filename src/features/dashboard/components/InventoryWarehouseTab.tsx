import React from 'react';
import { Row, Col, Card, Table, Tag } from 'antd';
import { InboxOutlined, AlertOutlined, SyncOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { KpiStatCard as KpiCard } from '@/components/common';
import type { InventoryDashboardData, LowStockItem, RecentMovement } from '../types';

interface InventoryWarehouseTabProps {
  data?: InventoryDashboardData;
}

export const InventoryWarehouseTab: React.FC<InventoryWarehouseTabProps> = ({ data }) => {
  const formatCurr = (val?: number) =>
    val != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val) : '$0.00';

  const lowStockColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (t: string) => <Tag color="red">{t}</Tag> },
    { title: 'Product Name', dataIndex: 'name', key: 'name', render: (t: string) => <strong>{t}</strong> },
    {
      title: 'Available Qty',
      dataIndex: 'quantityAvailable',
      key: 'quantityAvailable',
      align: 'right' as const,
      render: (q: number, r: LowStockItem) => (
        <span style={{ color: q <= 5 ? '#f87171' : '#fbbf24', fontWeight: 700 }}>
          {q} {r.unitOfMeasure}
        </span>
      ),
    },
    {
      title: 'Base Price',
      dataIndex: 'basePrice',
      key: 'basePrice',
      align: 'right' as const,
      render: (v: number) => formatCurr(v),
    },
  ];

  const movementColumns = [
    {
      title: 'Type',
      dataIndex: 'movementType',
      key: 'movementType',
      render: (t: string) => {
        const colors: Record<string, string> = {
          RECEIPT: 'green',
          DISPATCH: 'blue',
          TRANSFER: 'cyan',
          ADJUSTMENT: 'orange',
        };
        return <Tag color={colors[t] || 'default'}>{t}</Tag>;
      },
    },
    { title: 'Product', dataIndex: 'productName', key: 'productName' },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (q: number, r: RecentMovement) => (
        <strong style={{ color: r.movementType === 'RECEIPT' ? '#34d399' : '#e6edf3' }}>
          {r.movementType === 'RECEIPT' ? `+${q}` : q}
        </strong>
      ),
    },
    {
      title: 'Total Value',
      dataIndex: 'totalValue',
      key: 'totalValue',
      align: 'right' as const,
      render: (v: number) => formatCurr(v),
    },
    { title: 'Ref #', dataIndex: 'referenceId', key: 'referenceId', render: (r: string) => <code>{r}</code> },
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp' },
    { title: 'Operator', dataIndex: 'performedBy', key: 'performedBy' },
  ];

  return (
    <div className="inventory-warehouse-tab">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Total Stock Value"
            value={formatCurr(data?.totalStockValue)}
            icon={<InboxOutlined />}
            iconColorClass="icon-emerald"
            badgeText="Valuation"
            badgeType="up"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Total SKUs"
            value={data?.totalItemsCount || 0}
            icon={<CheckCircleOutlined />}
            iconColorClass="icon-blue"
            badgeText="Active Catalog"
            badgeType="neutral"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Low Stock Alerts"
            value={data?.lowStockCount || 0}
            icon={<AlertOutlined />}
            iconColorClass="icon-rose"
            badgeText="Action Needed"
            badgeType={(data?.lowStockCount || 0) > 0 ? 'down' : 'up'}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Pending Transfers"
            value={data?.pendingTransfersCount || 0}
            icon={<SyncOutlined />}
            iconColorClass="icon-amber"
            badgeText="In Transit"
            badgeType="neutral"
          />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={10}>
          <Card className="dashboard-panel dashboard-table" title="Low Stock Alerts (Restock Required)" bordered={false}>
            <Table<LowStockItem>
              dataSource={data?.lowStockItems || []}
              columns={lowStockColumns}
              rowKey="productId"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card className="dashboard-panel dashboard-table" title="Recent Stock Movements Ledger" variant="borderless">
            <Table<RecentMovement>
              dataSource={data?.recentMovements || []}
              columns={movementColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
