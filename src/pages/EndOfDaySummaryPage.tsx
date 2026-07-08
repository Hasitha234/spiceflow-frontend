import { useEffect, useState } from 'react';
import { Card, Col, DatePicker, Row, Statistic, Table, Tag, Typography, message, Space, Empty } from 'antd';
import {
  DollarOutlined, BankOutlined, CreditCardOutlined, ShopOutlined, TruckOutlined, FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../api/client';

const { Title, Text } = Typography;

interface ChequeDetail {
  chequeNo: string;
  bankName: string;
  amount: number;
  shopName: string;
  chequeDate: string;
}

interface DeliverySummary {
  deliveryId: number;
  driverName: string;
  status: string;
  salesValue: number;
  collectedAmount: number;
  shopCount: number;
}

interface EndOfDaySummary {
  date: string;
  totalSalesValue: number;
  totalCashCollected: number;
  totalChequeAmount: number;
  totalLoanGiven: number;
  totalReturnsValue: number;
  totalDiscounts: number;
  deliveryCount: number;
  shopsVisited: number;
  chequeDetails: ChequeDetail[];
  deliveries: DeliverySummary[];
}

export function EndOfDaySummaryPage() {

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [summary, setSummary] = useState<EndOfDaySummary | null>(null);

  const loadSummary = async (date: dayjs.Dayjs) => {

    try {
      const res = await apiClient.get('/api/v1/reports/end-of-day-summary', {
        params: { date: date.format('YYYY-MM-DD') },
      });
      setSummary(res.data);
    } catch {
      message.error('Failed to load end-of-day summary');
    }
  };

  useEffect(() => { loadSummary(selectedDate); }, [selectedDate]);

  const fmt = (val: number) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Space>
            <div style={{ padding: '12px', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '12px' }}>
              <FileTextOutlined style={{ fontSize: '24px', color: '#10b981' }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0 }}>End-of-Day Summary</Title>
              <Text type="secondary">Daily breakdown of cash, cheques, and loan collections</Text>
            </div>
          </Space>
        </Col>
        <Col>
          <DatePicker
            size="large"
            value={selectedDate}
            onChange={(date) => {
              if (date) { setSelectedDate(date); loadSummary(date); }
            }}
            style={{ width: '200px' }}
          />
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '12px', borderTop: '4px solid #10b981' }}>
            <Statistic title="Total Sales" value={fmt(summary?.totalSalesValue || 0)} prefix={<DollarOutlined />}
              valueStyle={{ color: '#10b981', fontFamily: 'monospace' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '12px', borderTop: '4px solid #52c41a' }}>
            <Statistic title="Cash Collected" value={fmt(summary?.totalCashCollected || 0)} prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a', fontFamily: 'monospace' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '12px', borderTop: '4px solid #1677ff' }}>
            <Statistic title="Cheques Received" value={fmt(summary?.totalChequeAmount || 0)} prefix={<BankOutlined />}
              valueStyle={{ color: '#1677ff', fontFamily: 'monospace' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '12px', borderTop: '4px solid #fa8c16' }}>
            <Statistic title="Loan / Credit Given" value={fmt(summary?.totalLoanGiven || 0)} prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#fa8c16', fontFamily: 'monospace' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic title="Deliveries" value={summary?.deliveryCount || 0} prefix={<TruckOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic title="Shops Visited" value={summary?.shopsVisited || 0} prefix={<ShopOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic title="Returns Value" value={fmt(summary?.totalReturnsValue || 0)} valueStyle={{ color: '#f5222d', fontFamily: 'monospace' }} />
          </Card>
        </Col>
      </Row>

      {/* Deliveries Table */}
      <Card title="Delivery Breakdown" style={{ borderRadius: '12px', marginBottom: '24px' }}>
        {(summary?.deliveries || []).length > 0 ? (
          <Table dataSource={summary?.deliveries || []} rowKey="deliveryId" pagination={false} size="small"
            columns={[
              { title: 'Delivery', dataIndex: 'deliveryId', key: 'id', render: (v: number) => <Text strong>#{v}</Text> },
              { title: 'Driver', dataIndex: 'driverName', key: 'driver', render: (v: string) => v || '—' },
              {
                title: 'Status', dataIndex: 'status', key: 'status',
                render: (v: string) => <Tag color={v === 'COMPLETED' ? 'green' : 'blue'}>{v}</Tag>,
              },
              { title: 'Shops', dataIndex: 'shopCount', key: 'shops', align: 'right' },
              { title: 'Sales (LKR)', dataIndex: 'salesValue', key: 'sales', align: 'right', render: (v: number) => fmt(v) },
              { title: 'Collected (LKR)', dataIndex: 'collectedAmount', key: 'collected', align: 'right', render: (v: number) => <Text style={{ color: '#10b981', fontWeight: 600 }}>{fmt(v)}</Text> },
            ]} />
        ) : (
          <Empty description="No deliveries on this date" />
        )}
      </Card>

      {/* Cheque Details */}
      <Card title="Cheque Details" style={{ borderRadius: '12px' }}>
        {(summary?.chequeDetails || []).length > 0 ? (
          <Table dataSource={summary?.chequeDetails || []} rowKey="chequeNo" pagination={false} size="small"
            columns={[
              { title: 'Cheque No', dataIndex: 'chequeNo', key: 'chequeNo', render: (v: string) => <Text code>{v}</Text> },
              { title: 'Bank', dataIndex: 'bankName', key: 'bank' },
              { title: 'Shop', dataIndex: 'shopName', key: 'shop' },
              { title: 'Cheque Date', dataIndex: 'chequeDate', key: 'date', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '—' },
              { title: 'Amount (LKR)', dataIndex: 'amount', key: 'amount', align: 'right', render: (v: number) => <Text style={{ fontFamily: 'monospace', fontWeight: 600 }}>{fmt(v)}</Text> },
            ]} />
        ) : (
          <Empty description="No cheques received on this date" />
        )}
      </Card>
    </div>
  );
}
