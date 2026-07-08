import React from 'react';
import { Row, Col, Card, Table, Tag } from 'antd';
import { CarOutlined, ShoppingCartOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { KpiStatCard as KpiCard } from '@/components/common';
import type { LogisticsDashboardData, ActiveLoadingSheet, InProgressDelivery } from '../types';

interface LogisticsDispatchTabProps {
  data?: LogisticsDashboardData;
}

export const LogisticsDispatchTab: React.FC<LogisticsDispatchTabProps> = ({ data }) => {
  const sheetColumns = [
    { title: 'Sheet #', dataIndex: 'sheetNumber', key: 'sheetNumber', render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: 'Driver Name', dataIndex: 'driverName', key: 'driverName', render: (t: string) => <strong>{t}</strong> },
    { title: 'Loading Date', dataIndex: 'loadingDate', key: 'loadingDate' },
    { title: 'Item Count', dataIndex: 'itemCount', key: 'itemCount', align: 'center' as const },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const colors: Record<string, string> = {
          DRAFT: 'default',
          CONFIRMED: 'cyan',
          DISPATCHED: 'orange',
          COMPLETED: 'green',
        };
        return <Tag color={colors[s] || 'blue'}>{s}</Tag>;
      },
    },
  ];

  const deliveryColumns = [
    { title: 'Delivery #', dataIndex: 'deliveryNumber', key: 'deliveryNumber', render: (t: string) => <Tag color="purple">{t}</Tag> },
    { title: 'Loading Sheet', dataIndex: 'loadingSheetNumber', key: 'loadingSheetNumber', render: (t: string) => <code>{t}</code> },
    { title: 'Driver Name', dataIndex: 'driverName', key: 'driverName' },
    { title: 'Delivery Date', dataIndex: 'deliveryDate', key: 'deliveryDate' },
    { title: 'Shops on Route', dataIndex: 'shopCount', key: 'shopCount', align: 'center' as const },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const colors: Record<string, string> = {
          PENDING: 'orange',
          IN_PROGRESS: 'blue',
          COMPLETED: 'green',
        };
        return <Tag color={colors[s] || 'default'}>{s}</Tag>;
      },
    },
  ];

  return (
    <div className="logistics-dispatch-tab">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Active Loading Sheets"
            value={data?.activeLoadingSheetsCount || 0}
            icon={<CarOutlined />}
            iconColorClass="icon-emerald"
            badgeText="Dispatch Bay"
            badgeType="up"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="In-Progress Deliveries"
            value={data?.inProgressDeliveriesCount || 0}
            icon={<ShoppingCartOutlined />}
            iconColorClass="icon-blue"
            badgeText="Active Routes"
            badgeType="neutral"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Completed Today"
            value={data?.completedDeliveriesToday || 0}
            icon={<CheckCircleOutlined />}
            iconColorClass="icon-purple"
            badgeText="Daily Done"
            badgeType="up"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Returned Items Today"
            value={data?.totalReturnItemsToday || 0}
            icon={<SyncOutlined />}
            iconColorClass="icon-amber"
            badgeText="Returns"
            badgeType={(data?.totalReturnItemsToday || 0) > 0 ? 'down' : 'neutral'}
          />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card className="dashboard-panel dashboard-table" title="Active Loading Sheets (In Dispatch)" variant="borderless">
            <Table<ActiveLoadingSheet>
              dataSource={data?.activeLoadingSheets || []}
              columns={sheetColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="dashboard-panel dashboard-table" title="In-Progress Delivery Routes" variant="borderless">
            <Table<InProgressDelivery>
              dataSource={data?.inProgressDeliveries || []}
              columns={deliveryColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
