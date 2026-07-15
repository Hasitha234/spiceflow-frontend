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
        title: t('loadingSheet.title', 'Delivery ID'),
        dataIndex: 'id',
        key: 'id',
        render: (val: string) => <span className="font-mono text-emerald-500 font-semibold">#{val || '—'}</span>,
      },
      {
        title: t('delivery.loadingSheet', 'Loading Sheet'),
        key: 'loadingSheet',
        render: (_: unknown, record: Delivery) => (
          <span className="font-medium text-slate-800 dark:text-slate-200">
            LS-{record.loadingSheet?.id || '—'} ({record.loadingSheet?.driver?.name || 'Driver'})
          </span>
        ),
      },
      {
        title: t('delivery.status', 'Status'),
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
          const color = status === 'COMPLETED' ? 'green' : 'blue';
          return <Tag color={color}>{status || 'IN_PROGRESS'}</Tag>;
        },
      },
      {
        title: t('daySummary.routesShopsVisited', 'Shops Visited'),
        key: 'shopsCount',
        render: (_: unknown, record: Delivery) => (
          <Tag color="purple">{record.shops?.length || 0} Shops</Tag>
        ),
      },
      {
        title: t('reports.totalSales', 'Total Sales (LKR)'),
        key: 'totalSales',
        align: 'right' as const,
        render: (_: unknown, record: Delivery) => (
          <span className="text-slate-900 font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {Number((record as unknown as { totalSalesValue?: number }).totalSalesValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        title: t('daySummary.totalCollected', 'Collected (LKR)'),
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
            <Tooltip title={t('daySummary.viewDelivery', 'View Delivery Details')}>
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
            <Tooltip title={t('daySummary.viewPurchaseOrder', 'View Purchase Details')}>
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
        title: t('purchase.invoiceNo', 'Order No'),
        dataIndex: 'orderNumber',
        key: 'orderNumber',
        render: (val: string) => <span className="font-mono text-emerald-500 font-semibold">{val || '—'}</span>,
      },
      {
        title: t('repOrder.rep', 'Rep'),
        key: 'rep',
        render: (_: unknown, record: RepOrder) => (
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {record.repName || '—'}
          </span>
        ),
      },
      {
        title: t('repOrder.status', 'Status'),
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
          const color = status === 'CONFIRMED' || status === 'COMPLETED' ? 'green' : 'orange';
          return <Tag color={color}>{status || 'DRAFT'}</Tag>;
        },
      },
      {
        title: t('repOrder.shops', 'Shops'),
        key: 'shopsCount',
        render: (_: unknown, record: RepOrder) => (
          <Tag color="blue">{record.shops?.length || 0} Shops</Tag>
        ),
      },
      {
        title: t('repOrder.netAmount', 'Net Amount (LKR)'),
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
            <Tooltip title={t('daySummary.viewRepOrder', 'View Rep Order Details')}>
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
              <Title level={3} style={{ margin: 0 }}>{t('daySummary.pageTitle', 'Day Summary & Financial Audit')}</Title>
              <Text type="secondary">{t('daySummary.pageSubtitle', 'Comprehensive daily breakdown of cash, cheques, purchases, rep orders, and deliveries')}</Text>
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
              title={t('daySummary.totalCashCollected', 'Total Cash Collected')}
              value={fmt(summaryData?.totalCashCollected || 0)}
              prefix={<DollarOutlined />}
              styles={{ content: { color: '#10b981', fontFamily: 'monospace' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '12px', borderTop: '4px solid #1677ff' }}>
            <Statistic
              title={t('daySummary.chequesReceived', 'Cheques Received')}
              value={fmt(summaryData?.totalChequeAmount || 0)}
              prefix={<BankOutlined />}
              styles={{ content: { color: '#1677ff', fontFamily: 'monospace' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '12px', borderTop: '4px solid #fa8c16' }}>
            <Statistic
              title={t('daySummary.loanGiven', 'Loan / Credit Given')}
              value={fmt(summaryData?.totalLoanGiven || 0)}
              prefix={<CreditCardOutlined />}
              styles={{ content: { color: '#fa8c16', fontFamily: 'monospace' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: '12px', borderTop: '4px solid #722ed1' }}>
            <Statistic
              title={t('daySummary.fullIncome', 'Full Income (Cash + Cheque)')}
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
              title={t('daySummary.grossDeliverySales', 'Gross Delivery Sales Value')}
              value={fmt(summaryData?.totalSalesValue || 0)}
              prefix={<TruckOutlined />}
              styles={{ content: { fontFamily: 'monospace' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
            <Statistic
              title={t('daySummary.routesShopsVisited', 'Routes / Shops Visited')}
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
              title={t('daySummary.returnsDiscounts', 'Returns & Discounts')}
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
            title={<Space><BankOutlined style={{ color: '#1677ff' }} /><span>{t('daySummary.todaysCheques', "Today's Cheques Received")} ({summaryData?.chequeDetails?.length || 0})</span></Space>}
            style={{ borderRadius: '12px' }}
          >
            {(summaryData?.chequeDetails || []).length > 0 ? (
              <Table
                dataSource={summaryData?.chequeDetails || []}
                rowKey="chequeNo"
                pagination={false}
                size="small"
                columns={[
                  { title: t('purchase.chequeNo', 'Cheque No'), dataIndex: 'chequeNo', key: 'chequeNo', render: (val) => <Text code>{val}</Text> },
                  { title: t('purchase.chequeBank', 'Bank Name'), dataIndex: 'bankName', key: 'bankName', render: (val) => val || '—' },
                  { title: t('shop.title', 'Shop / Customer'), dataIndex: 'shopName', key: 'shopName', render: (val) => <Text strong>{val || '—'}</Text> },
                  { title: t('purchase.chequeDate', 'Cheque Date'), dataIndex: 'chequeDate', key: 'chequeDate', render: (val) => val || '—' },
                  { title: t('purchase.chequeAmount', 'Amount (LKR)'), dataIndex: 'amount', key: 'amount', align: 'right', render: (val) => <Text style={{ fontFamily: 'monospace', fontWeight: 600 }}>{fmt(Number(val || 0))}</Text> },
                ]}
              />
            ) : (
              <Empty description={t('daySummary.noCheques', 'No cheques received on this date')} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={<Space><ExclamationCircleOutlined style={{ color: '#f5222d' }} /><span>{t('daySummary.cancelledOrders', 'Cancelled Loading Sheets / Orders')} ({summaryData?.cancelledOrders?.length || 0})</span></Space>}
            style={{ borderRadius: '12px' }}
          >
            {(summaryData?.cancelledOrders || []).length > 0 ? (
              <Table
                dataSource={summaryData?.cancelledOrders || []}
                rowKey="loadingSheetId"
                pagination={false}
                size="small"
                columns={[
                  { title: t('loadingSheet.title', 'Sheet #'), dataIndex: 'loadingSheetId', key: 'loadingSheetId', width: 80, render: (val) => <Tag color="error">#{val}</Tag> },
                  { title: t('loadingSheet.driver', 'Driver'), dataIndex: 'driverName', key: 'driverName', render: (val) => <Text strong>{val || '—'}</Text> },
                  { title: t('repOrder.rep', 'Rep'), dataIndex: 'repName', key: 'repName', render: (val) => val || '—' },
                  { title: t('common.description', 'Reason'), dataIndex: 'reason', key: 'reason', render: (val) => <Text type="secondary" style={{ fontSize: '12px' }}>{val || 'Stock returned'}</Text> },
                ]}
              />
            ) : (
              <Empty description={t('daySummary.noCancelled', 'No cancelled loading sheets on this date')} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Today's Purchases Breakdown */}
      <Card
        title={<Space><ShoppingOutlined style={{ color: '#10b981' }} /><span>{t('daySummary.todaysPurchases', "Today's Purchases")} ({purchases.length})</span></Space>}
        style={{ borderRadius: '12px', borderTop: '4px solid #10b981', marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={8}>
            <Statistic title={t('daySummary.totalPurchaseOrders', 'Total Purchase Orders')} value={purchases.length} styles={{ content: { fontFamily: 'monospace', fontSize: '18px' } }} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title={t('daySummary.totalValue', 'Total Value (LKR)')} value={fmt(totalValue)} styles={{ content: { fontFamily: 'monospace', fontSize: '18px', color: '#10b981' } }} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title={t('daySummary.draftConfirmed', 'Draft / Confirmed')} value={draftCount} suffix={`/ ${confirmedCount}`} styles={{ content: { fontFamily: 'monospace', fontSize: '18px' } }} />
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
          <Empty description={t('daySummary.noPurchasesDate', 'No purchases recorded for this date')} />
        )}
      </Card>

      {/* Today's Rep Orders Breakdown */}
      <Card
        title={<Space><FileTextOutlined style={{ color: '#1677ff' }} /><span>{t('daySummary.todaysRepOrders', "Today's Rep Orders")} ({repOrders.length})</span></Space>}
        style={{ borderRadius: '12px', borderTop: '4px solid #1677ff', marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={8}>
            <Statistic title={t('daySummary.totalRepOrders', 'Total Rep Orders')} value={repOrders.length} styles={{ content: { fontFamily: 'monospace', fontSize: '18px' } }} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title={t('daySummary.totalValue', 'Total Value (LKR)')} value={fmt(repTotalValue)} styles={{ content: { fontFamily: 'monospace', fontSize: '18px', color: '#1677ff' } }} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title={t('daySummary.draftConfirmed', 'Draft / Confirmed')} value={repDraftCount} suffix={`/ ${repConfirmedCount}`} styles={{ content: { fontFamily: 'monospace', fontSize: '18px' } }} />
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
          <Empty description={t('daySummary.noRepOrders', 'No rep orders recorded for this date')} />
        )}
      </Card>

      {/* Today's Deliveries Breakdown */}
      <Card
        title={<Space><TruckOutlined style={{ color: '#fa8c16' }} /><span>{t('daySummary.todaysDeliveries', "Today's Deliveries")} ({deliveries.length})</span></Space>}
        style={{ borderRadius: '12px', borderTop: '4px solid #fa8c16', marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={8}>
            <Statistic title={t('daySummary.totalDeliveries', 'Total Deliveries')} value={deliveries.length} styles={{ content: { fontFamily: 'monospace', fontSize: '18px' } }} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title={t('daySummary.totalCollected', 'Total Collected (LKR)')} value={fmt(deliveryTotalCollected)} suffix={`/ ${fmt(deliveryTotalSales)}`} styles={{ content: { fontFamily: 'monospace', fontSize: '18px', color: '#fa8c16' } }} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title={t('daySummary.completedInProgress', 'Completed / In Progress')} value={deliveryCompletedCount} suffix={`/ ${deliveries.length - deliveryCompletedCount}`} styles={{ content: { fontFamily: 'monospace', fontSize: '18px' } }} />
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
          <Empty description={t('daySummary.noDeliveries', 'No deliveries recorded for this date')} />
        )}
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
            <TruckOutlined className="text-emerald-500" />
            <span>{t('daySummary.viewDelivery', 'View Delivery')} #{selectedDelivery?.id}</span>
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
              <Descriptions.Item label={t('daySummary.loadingSheet', 'Loading Sheet')}>LS-{selectedDelivery.loadingSheet?.id}</Descriptions.Item>
              <Descriptions.Item label={t('daySummary.driver', 'Driver')}>{selectedDelivery.loadingSheet?.driver?.name || '—'}</Descriptions.Item>
              <Descriptions.Item label={t('delivery.status', 'Status')}><Tag color={selectedDelivery.status === 'COMPLETED' ? 'green' : 'blue'}>{selectedDelivery.status}</Tag></Descriptions.Item>
              <Descriptions.Item label={t('daySummary.totalSales', 'Total Sales')}>LKR {Number((selectedDelivery as unknown as { totalSalesValue?: number }).totalSalesValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
              <Descriptions.Item label={t('daySummary.totalReturns', 'Total Returns')}>LKR {Number((selectedDelivery as unknown as { totalReturnsValue?: number }).totalReturnsValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
              <Descriptions.Item label={t('daySummary.totalCollected', 'Total Collected')}><span className="text-emerald-600 font-bold">LKR {Number((selectedDelivery as unknown as { totalCollectedAmount?: number }).totalCollectedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></Descriptions.Item>
            </Descriptions>

            <Title level={5} className="!mb-3">{t('daySummary.shopsInRoute', 'Shops in Route')}</Title>
            {(selectedDelivery.shops || []).map((shop: DeliveryShop, idx: number) => {
              const shopData = shop as DeliveryShop & { shopName?: string; shopId?: string | number };
              return (
              <Card key={idx} size="small" style={{ marginBottom: '12px', borderLeft: '4px solid #10b981' }}
                title={<Space><span>{shopData.shopName || shopData.shop?.name || `Shop #${shopData.shopId || shopData.shop?.id}`}</span><Tag color="green">{t('delivery.delivered', 'Delivered')}</Tag></Space>}>
                <Descriptions size="small" column={4}>
                  <Descriptions.Item label={t('daySummary.grossBill', 'Gross Bill')}>{Number(shop.grossBillAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
                  <Descriptions.Item label={t('daySummary.discount', 'Discount')}>{Number(shop.totalDiscount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
                  <Descriptions.Item label={t('daySummary.paid', 'Paid')}>{Number(shop.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
                  <Descriptions.Item label={t('daySummary.creditLoan', 'Credit (Loan)')}>{Number(shop.creditAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
                </Descriptions>
              </Card>
              );
            })}
            {(selectedDelivery.shops || []).length === 0 && (
              <div className="text-center p-6 text-slate-500">No shop deliveries recorded yet.</div>
            )}

            <div className="flex justify-end pt-4 mt-4 border-t border-black/10 dark:border-white/10">
              <Button onClick={() => setSelectedDelivery(null)}>{t('common.close', 'Close')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
            <ShoppingOutlined className="text-emerald-500" />
            <span>{t('daySummary.viewPurchaseOrder', 'View Purchase Order')}</span>
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
                <div className="text-xs opacity-70">{t('purchase.invoiceNo', 'Invoice No')}</div>
                <div className="font-mono font-bold text-emerald-500 text-base">{selectedPurchase.invoiceNo}</div>
              </Col>
              <Col span={8}>
                <div className="text-xs opacity-70">{t('purchase.supplier', 'Supplier')}</div>
                <div className="font-semibold text-base">{selectedPurchase.supplierName || '—'}</div>
              </Col>
              <Col span={8}>
                <div className="text-xs opacity-70">{t('daySummary.invoiceDate', 'Invoice Date')}</div>
                <div className="text-base">{selectedPurchase.invoiceDate || '—'}</div>
              </Col>
              <Col span={8}>
                <div className="text-xs opacity-70">{t('purchase.status', 'Status')}</div>
                <div className="mt-1"><Tag color={selectedPurchase.status === 'CONFIRMED' || selectedPurchase.status === 'COMPLETED' ? 'green' : 'orange'}>{selectedPurchase.status}</Tag></div>
              </Col>
              <Col span={8}>
                <div className="text-xs opacity-70">{t('purchase.totalAmount', 'Total Order Value')}</div>
                <div className="font-mono font-bold text-base">
                  LKR {Number(selectedPurchase.netAmount ?? selectedPurchase.totalOrderValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </Col>
            </Row>

            <div>
              <Title level={5} className="!mb-3">{t('daySummary.lineItems', 'Line Items')}</Title>
              <Table
                dataSource={selectedPurchase.lineItems || []}
                rowKey="id"
                pagination={false}
                columns={[
                  { title: t('product.sku', 'SKU'), dataIndex: 'productSku', key: 'sku', render: (val: string) => <span className="font-mono text-emerald-500">{val || '—'}</span> },
                  { title: t('product.name', 'Product Name'), dataIndex: 'productName', key: 'name', render: (val: string) => <span className="font-medium">{val || '—'}</span> },
                  { title: t('inventory.boxes', 'Boxes'), dataIndex: 'noOfBoxes', key: 'boxes', align: 'right' },
                  { title: t('inventory.quantity', 'Quantity'), dataIndex: 'soldQuantity', key: 'qty', align: 'right' },
                  { title: t('product.unitType', 'Unit Type'), dataIndex: 'unitType', key: 'unit', render: (val: string) => <Tag color="purple">{val}</Tag> },
                  { title: t('product.ratePerSoldUnit', 'Rate (LKR)'), dataIndex: 'rate', key: 'rate', align: 'right', render: (val: number) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
                  { title: t('purchase.totalAmount', 'Amount (LKR)'), dataIndex: 'amount', key: 'amount', align: 'right', render: (val: number) => <span className="font-mono font-semibold">{Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
                ]}
              />
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-black/10 dark:border-white/10">
              <Button onClick={() => setSelectedPurchase(null)}>
                {t('common.close', 'Close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-200">
            <ShoppingOutlined className="text-emerald-500" />
            <span>{t('daySummary.viewRepOrder', 'View Rep Order')}</span>
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
                <div className="text-xs opacity-70">{t('purchase.invoiceNo', 'Order No')}</div>
                <div className="font-mono font-bold text-emerald-500 text-base">{selectedRepOrder.orderNumber}</div>
              </Col>
              <Col span={6}>
                <div className="text-xs opacity-70">{t('repOrder.rep', 'Rep')}</div>
                <div className="font-semibold text-base">{selectedRepOrder.repName || '—'}</div>
              </Col>
              <Col span={6}>
                <div className="text-xs opacity-70">{t('repOrder.orderDate', 'Order Date')}</div>
                <div className="text-base">{selectedRepOrder.orderDate || '—'}</div>
              </Col>
              <Col span={6}>
                <div className="text-xs opacity-70">{t('repOrder.status', 'Status')}</div>
                <div className="mt-1"><Tag color={selectedRepOrder.status === 'CONFIRMED' || selectedRepOrder.status === 'COMPLETED' ? 'green' : 'orange'}>{selectedRepOrder.status}</Tag></div>
              </Col>
            </Row>

            <div>
              <Title level={5} className="!mb-3">{t('repOrder.shops', 'Shops')} ({selectedRepOrder.shops?.length || 0})</Title>
              <Table
                dataSource={selectedRepOrder.shops || []}
                rowKey="id"
                pagination={false}
                expandable={{
                  expandedRowRender: (record) => (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                      <Title level={5} className="!text-sm !mb-2 opacity-70">{t('repOrder.items', 'Items for')} {record.shop?.name}</Title>
                      <Table
                        dataSource={record.items || []}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        columns={[
                          { title: t('product.sku', 'SKU'), dataIndex: ['product', 'sku'], key: 'sku', render: (val: string) => <span className="font-mono text-emerald-500">{val || '—'}</span> },
                          { title: t('product.name', 'Product Name'), dataIndex: ['product', 'name'], key: 'name', render: (val: string) => <span className="font-medium">{val || '—'}</span> },
                          { title: t('inventory.quantity', 'Quantity'), dataIndex: 'quantity', key: 'qty', align: 'right' },
                          { title: t('product.unitType', 'Unit Type'), dataIndex: 'unitType', key: 'unit', render: (val: string) => <Tag color="purple">{val}</Tag> },
                          { title: t('product.ratePerSoldUnit', 'Rate (LKR)'), dataIndex: 'rate', key: 'rate', align: 'right', render: (val: number) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
                          { title: t('repOrder.netAmount', 'Amount (LKR)'), dataIndex: 'netAmount', key: 'amount', align: 'right', render: (val: number) => <span className="font-mono font-semibold">{Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
                        ]}
                      />
                    </div>
                  ),
                }}
                columns={[
                  { title: t('shop.name', 'Shop Name'), dataIndex: ['shop', 'name'], key: 'name', render: (val: string) => <span className="font-medium">{val || '—'}</span> },
                  { title: t('repOrder.items', 'Items'), key: 'items', render: (_: unknown, record: RepOrderShop) => <Tag>{record.items?.length || 0} {t('repOrder.items', 'items')}</Tag> },
                  { title: t('repOrder.netAmount', 'Net Amount (LKR)'), dataIndex: 'netAmount', key: 'amount', align: 'right', render: (val: number) => <span className="font-mono font-semibold">{Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
                ]}
              />
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-black/10 dark:border-white/10">
              <Button onClick={() => setSelectedRepOrder(null)}>
                {t('common.close', 'Close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
