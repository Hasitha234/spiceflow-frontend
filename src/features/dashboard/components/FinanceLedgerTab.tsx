import React from 'react';
import { Row, Col, Card, Table, Tag } from 'antd';
import { BankOutlined, RiseOutlined, WarningOutlined, DollarOutlined } from '@ant-design/icons';
import { KpiCard } from './KpiCard';
import type { FinanceDashboardData, ReceivableAgingBucket, RecentFinancialTransaction } from '../types';

interface FinanceLedgerTabProps {
  data?: FinanceDashboardData;
}

export const FinanceLedgerTab: React.FC<FinanceLedgerTabProps> = ({ data }) => {
  const formatCurr = (val?: number) =>
    val != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val) : '$0.00';

  const agingColumns = [
    { title: 'Aging Bucket', dataIndex: 'bucketLabel', key: 'bucketLabel', render: (t: string) => <strong style={{ color: '#60a5fa' }}>{t}</strong> },
    { title: 'Shop Count', dataIndex: 'shopCount', key: 'shopCount', align: 'center' as const },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right' as const,
      render: (v: number) => <strong style={{ color: '#f87171' }}>{formatCurr(v)}</strong>,
    },
  ];

  const txColumns = [
    {
      title: 'Type',
      dataIndex: 'transactionType',
      key: 'transactionType',
      render: (t: string) => {
        const isColl = t === 'COLLECTION';
        return <Tag color={isColl ? 'green' : 'red'}>{isColl ? 'INFLOW (COLLECTION)' : 'OUTFLOW (PO SPEND)'}</Tag>;
      },
    },
    { title: 'Ref #', dataIndex: 'referenceNumber', key: 'referenceNumber', render: (r: string) => <code>{r}</code> },
    { title: 'Party (Shop / Supplier)', dataIndex: 'partyName', key: 'partyName', render: (p: string) => <strong>{p}</strong> },
    { title: 'Payment Method', dataIndex: 'paymentMethod', key: 'paymentMethod', render: (m: string) => <Tag color="blue">{m}</Tag> },
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp' },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (v: number, r: RecentFinancialTransaction) => {
        const isColl = r.transactionType === 'COLLECTION';
        return (
          <strong style={{ color: isColl ? '#34d399' : '#f87171', fontSize: '1.05em' }}>
            {isColl ? `+${formatCurr(v)}` : `-${formatCurr(v)}`}
          </strong>
        );
      },
    },
  ];

  return (
    <div className="finance-ledger-tab">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Total Receivables"
            value={formatCurr(data?.totalReceivables)}
            icon={<WarningOutlined />}
            iconColorClass="icon-rose"
            badgeText="Unpaid Loans"
            badgeType="down"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Total Payables"
            value={formatCurr(data?.totalPayables)}
            icon={<DollarOutlined />}
            iconColorClass="icon-amber"
            badgeText="Supplier POs"
            badgeType="neutral"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Net Cash Flow (MTD)"
            value={formatCurr(data?.netCashFlowMonth)}
            icon={<RiseOutlined />}
            iconColorClass="icon-purple"
            badgeText="Inflow - Outflow"
            badgeType={(data?.netCashFlowMonth || 0) >= 0 ? 'up' : 'down'}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Month Collections"
            value={formatCurr(data?.totalCollectionsMonth)}
            icon={<BankOutlined />}
            iconColorClass="icon-emerald"
            badgeText="Confirmed Cash"
            badgeType="up"
          />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={10}>
          <Card className="dashboard-panel dashboard-table" title="Receivables Aging Breakdown" bordered={false}>
            <Table<ReceivableAgingBucket>
              dataSource={data?.receivablesAgingBuckets || []}
              columns={agingColumns}
              rowKey="bucketLabel"
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card className="dashboard-panel dashboard-table" title="Chronological Financial Ledger (Live Feed)" variant="borderless">
            <Table<RecentFinancialTransaction>
              dataSource={data?.recentTransactions || []}
              columns={txColumns}
              rowKey="id"
              pagination={{ pageSize: 6 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
