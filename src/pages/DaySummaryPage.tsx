import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Col, DatePicker, Row, Statistic, Table, Tag, Typography, App, Space, Button, Tooltip, Modal, Descriptions, Empty } from 'antd';
import { ShoppingOutlined, DollarOutlined, FileTextOutlined, EyeOutlined, TruckOutlined, BankOutlined, ExclamationCircleOutlined, CreditCardOutlined, ShopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { purchaseApi, repOrderApi, deliveryApi, reportApi } from '../api/sales';
import type { Purchase, RepOrder, RepOrderShop, Delivery, DeliveryShop, EndOfDaySummary } from '../types/sales';

const { Title, Text } = Typography;

export function DaySummaryPage() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<EndOfDaySummary | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [repOrders, setRepOrders] = useState<RepOrder[]>([]);
  const [selectedRepOrder, setSelectedRepOrder] = useState<RepOrder | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  const fmt = (val?: number) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadData = useCallback(async (date: dayjs.Dayjs) => {
    setLoading(true);
    try {
      const dateStr = date.format('YYYY-MM-DD');
      const [purchaseRes, repOrderRes, deliveryRes, summaryRes] = await Promise.all([
        purchaseApi.list({ date: dateStr, size: 100 }),
        repOrderApi.list({ date: dateStr, size: 100 }),
        deliveryApi.list({ date: dateStr, size: 100 }),
        reportApi.endOfDaySummary(dateStr),
      ]);
      setPurchases(purchaseRes?.content || []);
      setRepOrders(repOrderRes?.content || []);
      setDeliveries(deliveryRes?.content || []);
      setSummaryData(summaryRes || null);
    } catch {
      message.error('Failed to load summary data for the selected date');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate, loadData]);

  const totalValue = useMemo(() => {
    return purchases.reduce((sum, p) => sum + Number(p.netAmount ?? p.totalOrderValue ?? 0), 0);
  }, [purchases]);

  const draftCount = useMemo(() => {
    return purchases.filter(p => p.status === 'DRAFT').length;
  }, [purchases]);

  const confirmedCount = useMemo(() => {
    return purchases.filter(p => p.status !== 'DRAFT').length;
  }, [purchases]);

  const repTotalValue = useMemo(() => {
    return repOrders.reduce((sum, o) => sum + Number(o.netAmount ?? 0), 0);
  }, [repOrders]);

  const repDraftCount = useMemo(() => {
    return repOrders.filter(o => o.status === 'DRAFT').length;
  }, [repOrders]);

  const repConfirmedCount = useMemo(() => {
    return repOrders.filter(o => o.status !== 'DRAFT').length;
  }, [repOrders]);

  const deliveryTotalSales = useMemo(() => {
    return deliveries.reduce((sum, d) => sum + Number((d as unknown as { totalSalesValue?: number }).totalSalesValue || 0), 0);
  }, [deliveries]);

  const deliveryTotalCollected = useMemo(() => {
    return deliveries.reduce((sum, d) => sum + Number((d as unknown as { totalCollectedAmount?: number }).totalCollectedAmount || 0), 0);
  }, [deliveries]);

  const deliveryCompletedCount = useMemo(() => {
    return deliveries.filter(d => d.status === 'COMPLETED').length;
  }, [deliveries]);

  const deliveryColumns = useMemo(
    () => [
      {
        title: 'Delivery ID',
        dataIndex: 'id',
        key: 'id',
        render: (val: string) => <span className="font-mono text-emerald-500 font-semibold">#{val || '—'}</span>,
      },
      {
        title: 'Loading Sheet',
        key: 'loadingSheet',
        render: (_: unknown, record: Delivery) => (
          <span className="font-medium text-slate-800 dark:text-slate-200">
            LS-{record.loadingSheet?.id || '—'} ({record.loadingSheet?.driver?.name || 'Driver'})
          </span>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
          const color = status === 'COMPLETED' ? 'green' : 'blue';
          return <Tag color={color}>{status || 'IN_PROGRESS'}</Tag>;
        },
      },
      {
        title: 'Shops Visited',
        key: 'shopsCount',
        render: (_: unknown, record: Delivery) => (
          <Tag color="purple">{record.shops?.length || 0} Shops</Tag>
        ),
      },
      {
        title: 'Total Sales (LKR)',
        key: 'totalSales',
        align: 'right' as const,
        render: (_: unknown, record: Delivery) => (
          <span className="text-slate-900 font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {Number((record as unknown as { totalSalesValue?: number }).totalSalesValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        title: 'Collected (LKR)',
        key: 'totalCollected',
        align: 'right' as const,
        render: (_: unknown, record: Delivery) => (
          <span className="text-emerald-600 font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {Number((record as unknown as { totalCollectedAmount?: number }).totalCollectedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        title: t('common.actions', 'Actions'),
        key: 'actions',
        align: 'right' as const,
        render: (_: unknown, record: Delivery) => (
          <Space>
            <Tooltip title="View Delivery Details">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setSelectedDelivery(record)}
                className="!text-blue-500 hover:!text-blue-400"
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [t]
  );

  const columns = useMemo(
    () => [
      {
        title: t('purchase.invoiceNo', 'Invoice No'),
        dataIndex: 'invoiceNo',
        key: 'invoiceNo',
        render: (val: string) => <span className="font-mono text-emerald-500 font-semibold">{val || '—'}</span>,
      },
      {
        title: t('purchase.supplier', 'Supplier'),
        key: 'supplier',
        render: (_: unknown, record: Purchase) => (
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {record.supplierName || record.supplier?.name || '—'}
          </span>
        ),
      },
      {
        title: t('purchase.status', 'Status'),
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
          const color = status === 'CONFIRMED' || status === 'COMPLETED' ? 'green' : 'orange';
          return <Tag color={color}>{status || 'DRAFT'}</Tag>;
        },
      },
      {
        title: t('purchase.totalAmount', 'Net Amount (LKR)'),
        key: 'netAmount',
        align: 'right' as const,
        render: (_: unknown, record: Purchase) => {
          const val = record.netAmount !== undefined ? record.netAmount : record.totalOrderValue ?? record.totalAmount ?? 0;
          return <span className="text-slate-900 font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>{Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
        },
      },
      {
        title: t('common.actions', 'Actions'),
        key: 'actions',
        align: 'right' as const,
        render: (_: unknown, record: Purchase) => (
          <Space>
            <Tooltip title="View Purchase Details">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setSelectedPurchase(record)}
                className="!text-blue-500 hover:!text-blue-400"
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [t]
  );

  const repColumns = useMemo(
    () => [
      {
        title: 'Order No',
        dataIndex: 'orderNumber',
        key: 'orderNumber',
        render: (val: string) => <span className="font-mono text-emerald-500 font-semibold">{val || '—'}</span>,
      },
      {
        title: 'Rep',
        key: 'rep',
        render: (_: unknown, record: RepOrder) => (
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {record.repName || '—'}
          </span>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
          const color = status === 'CONFIRMED' || status === 'COMPLETED' ? 'green' : 'orange';
          return <Tag color={color}>{status || 'DRAFT'}</Tag>;
        },
      },
      {
        title: 'Shops',
        key: 'shopsCount',
        render: (_: unknown, record: RepOrder) => (
          <Tag color="blue">{record.shops?.length || 0} Shops</Tag>
        ),
      },
      {
        title: 'Net Amount (LKR)',
        key: 'netAmount',
        align: 'right' as const,
        render: (_: unknown, record: RepOrder) => (
          <span className="text-slate-900 font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {Number(record.netAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        title: t('common.actions', 'Actions'),
        key: 'actions',
        align: 'right' as const,
        render: (_: unknown, record: RepOrder) => (
          <Space>
            <Tooltip title="View Rep Order Details">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setSelectedRepOrder(record)}
                className="!text-blue-500 hover:!text-blue-400"
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [t]
  );

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Space>
            <div style={{ padding: '12px', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '12px' }}>
              <FileTextOutlined style={{ fontSize: '24px', color: '#10b981' }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0 }}>Day Summary & Financial Audit</Title>
              <Text type="secondary">Comprehensive daily breakdown of cash, cheques, purchases, rep orders, and deliveries</Text>
            </div>
          </Space>
        </Col>
        <Col>
          <DatePicker
            size="large"
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            allowClear={false}
            style={{ width: '200px' }}
          />
        </Col>
      </Row>

      {/* Summary Cards Row 1: Primary Income & Collections */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '12px', borderTop: '4px solid #10b981' }}>
            <Statistic
              title="Total Cash Collected"
              value={fmt(summaryData?.totalCashCollected || 0)}
              prefix={<DollarOutlined />}
              styles={{ content: { color: '#10b981', fontFamily: 'monospace' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '12px', borderTop: '4px solid #1677ff' }}>
            <Statistic
              title="Cheques Received"
              value={fmt(summaryData?.totalChequeAmount || 0)}
              prefix={<BankOutlined />}
              styles={{ content: { color: '#1677ff', fontFamily: 'monospace' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '12px', borderTop: '4px solid #fa8c16' }}>
            <Statistic
              title="Loan / Credit Given"
              value={fmt(summaryData?.totalLoanGiven || 0)}
              prefix={<CreditCardOutlined />}
              styles={{ content: { color: '#fa8c16', fontFamily: 'monospace' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '12px', borderTop: '4px solid #722ed1' }}>
            <Statistic
              title="Full Income (Cash + Cheque)"
              value={fmt((summaryData?.totalCashCollected || 0) + (summaryData?.totalChequeAmount || 0))}
              prefix={<DollarOutlined />}
              styles={{ content: { color: '#722ed1', fontFamily: 'monospace', fontWeight: 700 } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Summary Cards Row 2: Operational Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic
              title="Gross Delivery Sales Value"
              value={fmt(summaryData?.totalSalesValue || 0)}
              prefix={<TruckOutlined />}
              styles={{ content: { fontFamily: 'monospace' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic
              title="Routes / Shops Visited"
              value={summaryData?.deliveryCount || 0}
              suffix={`Routes (${summaryData?.shopsVisited || 0} Shops)`}
              prefix={<ShopOutlined />}
              styles={{ content: { color: '#1677ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic
              title="Returns & Discounts"
              value={`- ${fmt((summaryData?.totalReturnsValue || 0) + (summaryData?.totalDiscounts || 0))}`}
              styles={{ content: { color: '#f5222d', fontFamily: 'monospace' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Cheque & Cancelled Orders Tables */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={14}>
          <Card
            title={<Space><BankOutlined style={{ color: '#1677ff' }} /><span>Today's Cheques Received ({summaryData?.chequeDetails?.length || 0})</span></Space>}
            style={{ borderRadius: '12px' }}
          >
            {(summaryData?.chequeDetails || []).length > 0 ? (
              <Table
                dataSource={summaryData?.chequeDetails || []}
                rowKey="chequeNo"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Cheque No', dataIndex: 'chequeNo', key: 'chequeNo', render: (val) => <Text code>{val}</Text> },
                  { title: 'Bank Name', dataIndex: 'bankName', key: 'bankName', render: (val) => val || '—' },
                  { title: 'Shop / Customer', dataIndex: 'shopName', key: 'shopName', render: (val) => <Text strong>{val || '—'}</Text> },
                  { title: 'Cheque Date', dataIndex: 'chequeDate', key: 'chequeDate', render: (val) => val || '—' },
                  { title: 'Amount (LKR)', dataIndex: 'amount', key: 'amount', align: 'right', render: (val) => <Text style={{ fontFamily: 'monospace', fontWeight: 600 }}>{fmt(Number(val || 0))}</Text> },
                ]}
              />
            ) : (
              <Empty description="No cheques received on this date" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={<Space><ExclamationCircleOutlined style={{ color: '#f5222d' }} /><span>Cancelled Loading Sheets / Orders ({summaryData?.cancelledOrders?.length || 0})</span></Space>}
            style={{ borderRadius: '12px' }}
          >
            {(summaryData?.cancelledOrders || []).length > 0 ? (
              <Table
                dataSource={summaryData?.cancelledOrders || []}
                rowKey="loadingSheetId"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Sheet #', dataIndex: 'loadingSheetId', key: 'loadingSheetId', width: 80, render: (val) => <Tag color="error">#{val}</Tag> },
                  { title: 'Driver', dataIndex: 'driverName', key: 'driverName', render: (val) => <Text strong>{val || '—'}</Text> },
                  { title: 'Rep', dataIndex: 'repName', key: 'repName', render: (val) => val || '—' },
                  { title: 'Reason', dataIndex: 'reason', key: 'reason', render: (val) => <Text type="secondary" style={{ fontSize: '12px' }}>{val || 'Stock returned'}</Text> },
                ]}
              />
            ) : (
              <Empty description="No cancelled loading sheets on this date" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Today's Purchases Breakdown */}
      <Card
        title={<Space><ShoppingOutlined style={{ color: '#10b981' }} /><span>Today's Purchases ({purchases.length})</span></Space>}
        style={{ borderRadius: '12px', borderTop: '4px solid #10b981', marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={8}>
            <Statistic title="Total Purchase Orders" value={purchases.length} styles={{ content: { fontFamily: 'monospace', fontSize: '18px' } }} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title="Total Value (LKR)" value={fmt(totalValue)} styles={{ content: { fontFamily: 'monospace', fontSize: '18px', color: '#10b981' } }} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title="Draft / Confirmed" value={draftCount} suffix={`/ ${confirmedCount}`} styles={{ content: { fontFamily: 'monospace', fontSize: '18px' } }} />
          </Col>
        </Row>
        {purchases.length > 0 ? (
          <Table
            rowKey="id"
            loading={loading}
            dataSource={purchases}
            columns={columns}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        ) : (
          <Empty description="No purchases recorded for this date" />
        )}
      </Card>

      {/* Today's Rep Orders Breakdown */}
      <Card
        title={<Space><FileTextOutlined style={{ color: '#1677ff' }} /><span>Today's Rep Orders ({repOrders.length})</span></Space>}
        style={{ borderRadius: '12px', borderTop: '4px solid #1677ff', marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={8}>
            <Statistic title="Total Rep Orders" value={repOrders.length} styles={{ content: { fontFamily: 'monospace', fontSize: '18px' } }} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title="Total Value (LKR)" value={fmt(repTotalValue)} styles={{ content: { fontFamily: 'monospace', fontSize: '18px', color: '#1677ff' } }} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title="Draft / Confirmed" value={repDraftCount} suffix={`/ ${repConfirmedCount}`} styles={{ content: { fontFamily: 'monospace', fontSize: '18px' } }} />
          </Col>
        </Row>
        {repOrders.length > 0 ? (
          <Table
            rowKey="id"
            loading={loading}
            dataSource={repOrders}
            columns={repColumns}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        ) : (
          <Empty description="No rep orders recorded for this date" />
        )}
      </Card>

      {/* Today's Deliveries Breakdown */}
      <Card
        title={<Space><TruckOutlined style={{ color: '#fa8c16' }} /><span>Today's Deliveries ({deliveries.length})</span></Space>}
        style={{ borderRadius: '12px', borderTop: '4px solid #fa8c16', marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={8}>
            <Statistic title="Total Deliveries" value={deliveries.length} styles={{ content: { fontFamily: 'monospace', fontSize: '18px' } }} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title="Total Collected (LKR)" value={fmt(deliveryTotalCollected)} suffix={`/ ${fmt(deliveryTotalSales)}`} styles={{ content: { fontFamily: 'monospace', fontSize: '18px', color: '#fa8c16' } }} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title="Completed / In Progress" value={deliveryCompletedCount} suffix={`/ ${deliveries.length - deliveryCompletedCount}`} styles={{ content: { fontFamily: 'monospace', fontSize: '18px' } }} />
          </Col>
        </Row>
        {deliveries.length > 0 ? (
          <Table
            rowKey="id"
            loading={loading}
            dataSource={deliveries}
            columns={deliveryColumns}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        ) : (
          <Empty description="No deliveries recorded for this date" />
        )}
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
            <TruckOutlined className="text-emerald-500" />
            <span>View Delivery #{selectedDelivery?.id}</span>
          </div>
        }
        open={!!selectedDelivery}
        onCancel={() => setSelectedDelivery(null)}
        width={900}
        footer={null}
      >
        {selectedDelivery && (
          <div className="space-y-6">
            <Descriptions bordered column={3} size="small" style={{ marginBottom: '24px' }}>
              <Descriptions.Item label="Loading Sheet">LS-{selectedDelivery.loadingSheet?.id}</Descriptions.Item>
              <Descriptions.Item label="Driver">{selectedDelivery.loadingSheet?.driver?.name || '—'}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={selectedDelivery.status === 'COMPLETED' ? 'green' : 'blue'}>{selectedDelivery.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Total Sales">LKR {Number((selectedDelivery as unknown as { totalSalesValue?: number }).totalSalesValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
              <Descriptions.Item label="Total Returns">LKR {Number((selectedDelivery as unknown as { totalReturnsValue?: number }).totalReturnsValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
              <Descriptions.Item label="Total Collected"><span className="text-emerald-600 font-bold">LKR {Number((selectedDelivery as unknown as { totalCollectedAmount?: number }).totalCollectedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></Descriptions.Item>
            </Descriptions>

            <Title level={5} className="!mb-3">Shops in Route</Title>
            {(selectedDelivery.shops || []).map((shop: DeliveryShop, idx: number) => {
              const shopData = shop as DeliveryShop & { shopName?: string; shopId?: string | number };
              return (
              <Card key={idx} size="small" style={{ marginBottom: '12px', borderLeft: '4px solid #10b981' }}
                title={<Space><span>{shopData.shopName || shopData.shop?.name || `Shop #${shopData.shopId || shopData.shop?.id}`}</span><Tag color="green">Delivered</Tag></Space>}>
                <Descriptions size="small" column={4}>
                  <Descriptions.Item label="Gross Bill">{Number(shop.grossBillAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
                  <Descriptions.Item label="Discount">{Number(shop.totalDiscount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
                  <Descriptions.Item label="Paid">{Number(shop.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
                  <Descriptions.Item label="Credit (Loan)">{Number(shop.creditAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
                </Descriptions>
              </Card>
              );
            })}
            {(selectedDelivery.shops || []).length === 0 && (
              <div className="text-center p-6 text-slate-500">No shop deliveries recorded yet.</div>
            )}

            <div className="flex justify-end pt-4 mt-4 border-t border-black/10 dark:border-white/10">
              <Button onClick={() => setSelectedDelivery(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
            <ShoppingOutlined className="text-emerald-500" />
            <span>View Purchase Order</span>
          </div>
        }
        open={!!selectedPurchase}
        onCancel={() => setSelectedPurchase(null)}
        width={950}
        footer={null}
      >
        {selectedPurchase && (
          <div className="space-y-6">
            <Row gutter={[16, 16]} className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              <Col span={8}>
                <div className="text-xs opacity-70">Invoice No</div>
                <div className="font-mono font-bold text-emerald-500 text-base">{selectedPurchase.invoiceNo}</div>
              </Col>
              <Col span={8}>
                <div className="text-xs opacity-70">Supplier</div>
                <div className="font-semibold text-base">{selectedPurchase.supplierName || '—'}</div>
              </Col>
              <Col span={8}>
                <div className="text-xs opacity-70">Invoice Date</div>
                <div className="text-base">{selectedPurchase.invoiceDate || '—'}</div>
              </Col>
              <Col span={8}>
                <div className="text-xs opacity-70">Status</div>
                <div className="mt-1"><Tag color={selectedPurchase.status === 'CONFIRMED' || selectedPurchase.status === 'COMPLETED' ? 'green' : 'orange'}>{selectedPurchase.status}</Tag></div>
              </Col>
              <Col span={8}>
                <div className="text-xs opacity-70">Total Order Value</div>
                <div className="font-mono font-bold text-base">
                  LKR {Number(selectedPurchase.netAmount ?? selectedPurchase.totalOrderValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </Col>
            </Row>

            <div>
              <Title level={5} className="!mb-3">Line Items</Title>
              <Table
                dataSource={selectedPurchase.lineItems || []}
                rowKey="id"
                pagination={false}
                columns={[
                  { title: 'SKU', dataIndex: 'productSku', key: 'sku', render: (val: string) => <span className="font-mono text-emerald-500">{val || '—'}</span> },
                  { title: 'Product Name', dataIndex: 'productName', key: 'name', render: (val: string) => <span className="font-medium">{val || '—'}</span> },
                  { title: 'Boxes', dataIndex: 'noOfBoxes', key: 'boxes', align: 'right' },
                  { title: 'Quantity', dataIndex: 'soldQuantity', key: 'qty', align: 'right' },
                  { title: 'Unit Type', dataIndex: 'unitType', key: 'unit', render: (val: string) => <Tag color="purple">{val}</Tag> },
                  { title: 'Rate (LKR)', dataIndex: 'rate', key: 'rate', align: 'right', render: (val: number) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
                  { title: 'Amount (LKR)', dataIndex: 'amount', key: 'amount', align: 'right', render: (val: number) => <span className="font-mono font-semibold">{Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
                ]}
              />
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-black/10 dark:border-white/10">
              <Button onClick={() => setSelectedPurchase(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
            <ShoppingOutlined className="text-emerald-500" />
            <span>View Rep Order</span>
          </div>
        }
        open={!!selectedRepOrder}
        onCancel={() => setSelectedRepOrder(null)}
        width={950}
        footer={null}
      >
        {selectedRepOrder && (
          <div className="space-y-6">
            <Row gutter={[16, 16]} className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              <Col span={6}>
                <div className="text-xs opacity-70">Order No</div>
                <div className="font-mono font-bold text-emerald-500 text-base">{selectedRepOrder.orderNumber}</div>
              </Col>
              <Col span={6}>
                <div className="text-xs opacity-70">Rep</div>
                <div className="font-semibold text-base">{selectedRepOrder.repName || '—'}</div>
              </Col>
              <Col span={6}>
                <div className="text-xs opacity-70">Order Date</div>
                <div className="text-base">{selectedRepOrder.orderDate || '—'}</div>
              </Col>
              <Col span={6}>
                <div className="text-xs opacity-70">Status</div>
                <div className="mt-1"><Tag color={selectedRepOrder.status === 'CONFIRMED' || selectedRepOrder.status === 'COMPLETED' ? 'green' : 'orange'}>{selectedRepOrder.status}</Tag></div>
              </Col>
            </Row>

            <div>
              <Title level={5} className="!mb-3">Shops ({selectedRepOrder.shops?.length || 0})</Title>
              <Table
                dataSource={selectedRepOrder.shops || []}
                rowKey="id"
                pagination={false}
                expandable={{
                  expandedRowRender: (record) => (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                      <Title level={5} className="!text-sm !mb-2 opacity-70">Items for {record.shop?.name}</Title>
                      <Table
                        dataSource={record.items || []}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        columns={[
                          { title: 'SKU', dataIndex: ['product', 'sku'], key: 'sku', render: (val: string) => <span className="font-mono text-emerald-500">{val || '—'}</span> },
                          { title: 'Product Name', dataIndex: ['product', 'name'], key: 'name', render: (val: string) => <span className="font-medium">{val || '—'}</span> },
                          { title: 'Quantity', dataIndex: 'quantity', key: 'qty', align: 'right' },
                          { title: 'Unit Type', dataIndex: 'unitType', key: 'unit', render: (val: string) => <Tag color="purple">{val}</Tag> },
                          { title: 'Rate (LKR)', dataIndex: 'rate', key: 'rate', align: 'right', render: (val: number) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
                          { title: 'Amount (LKR)', dataIndex: 'netAmount', key: 'amount', align: 'right', render: (val: number) => <span className="font-mono font-semibold">{Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
                        ]}
                      />
                    </div>
                  ),
                }}
                columns={[
                  { title: 'Shop Name', dataIndex: ['shop', 'name'], key: 'name', render: (val: string) => <span className="font-medium">{val || '—'}</span> },
                  { title: 'Items', key: 'items', render: (_: unknown, record: RepOrderShop) => <Tag>{record.items?.length || 0} items</Tag> },
                  { title: 'Net Amount (LKR)', dataIndex: 'netAmount', key: 'amount', align: 'right', render: (val: number) => <span className="font-mono font-semibold">{Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
                ]}
              />
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-black/10 dark:border-white/10">
              <Button onClick={() => setSelectedRepOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
