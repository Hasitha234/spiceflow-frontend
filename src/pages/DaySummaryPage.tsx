import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Col, DatePicker, Row, Statistic, Table, Tag, Typography, message, Space, Button, Tooltip, Modal, Descriptions } from 'antd';
import { ShoppingOutlined, DollarOutlined, FileTextOutlined, EyeOutlined, TruckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { purchaseApi, repOrderApi, deliveryApi } from '../api/sales';
import type { Purchase, RepOrder, RepOrderShop, Delivery, DeliveryShop } from '../types/sales';

const { Title } = Typography;

export function DaySummaryPage() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [repOrders, setRepOrders] = useState<RepOrder[]>([]);
  const [selectedRepOrder, setSelectedRepOrder] = useState<RepOrder | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  const loadData = useCallback(async (date: dayjs.Dayjs) => {
    setLoading(true);
    try {
      const dateStr = date.format('YYYY-MM-DD');
      const [purchaseRes, repOrderRes, deliveryRes] = await Promise.all([
        purchaseApi.list({ date: dateStr, size: 100 }),
        repOrderApi.list({ date: dateStr, size: 100 }),
        deliveryApi.list({ date: dateStr, size: 100 }),
      ]);
      setPurchases(purchaseRes?.content || []);
      setRepOrders(repOrderRes?.content || []);
      setDeliveries(deliveryRes?.content || []);
    } catch {
      message.error('Failed to load summary data for the selected date');
    } finally {
      setLoading(false);
    }
  }, []);

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
    <div className="p-6">
      <div className="flex justify-end mb-6 w-full">
        <DatePicker
          value={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          allowClear={false}
          size="large"
          className="w-60 rounded-md border-slate-300 shadow-sm"
        />
      </div>

      <Title level={4} className="mb-4">Today's Purchases</Title>
      <Row gutter={[16, 16]} className="w-full mb-6 mx-0">
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: '24px' } }} className="rounded-lg shadow-sm border border-slate-200">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <ShoppingOutlined className="text-emerald-600" /> <span>{t('daySummary.totalPurchases', 'Total Purchases')}</span>
                </div>
              }
              value={purchases.length}
              valueStyle={{ fontWeight: 600, fontSize: '1.5rem', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: '24px' } }} className="rounded-lg shadow-sm border border-slate-200">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <DollarOutlined className="text-emerald-600" /> <span>{t('daySummary.totalValue', 'Total Value (LKR)')}</span>
                </div>
              }
              value={totalValue}
              precision={2}
              valueStyle={{ fontWeight: 600, fontSize: '1.5rem', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: '24px' } }} className="rounded-lg shadow-sm border border-slate-200">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <FileTextOutlined className="text-emerald-600" /> <span>{t('daySummary.draftCount', 'Draft Orders')} / {t('daySummary.confirmedCount', 'Confirmed')}</span>
                </div>
              }
              value={draftCount}
              suffix={`/ ${confirmedCount}`}
              valueStyle={{ fontWeight: 600, fontSize: '1.5rem', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}
            />
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }} className="rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={purchases}
          columns={columns}
          pagination={{ pageSize: 20, className: 'px-4 py-3 border-t border-slate-100 m-0' }}
          locale={{ emptyText: t('daySummary.noPurchases', 'No purchases recorded for this date.') }}
          className="spiceflow-table"
        />
      </Card>

      <Title level={4} className="mt-8 mb-4">Today's Rep Orders</Title>
      <Row gutter={[16, 16]} className="w-full mb-6 mx-0">
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: '24px' } }} className="rounded-lg shadow-sm border border-slate-200">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <ShoppingOutlined className="text-emerald-600" /> <span>Total Rep Orders</span>
                </div>
              }
              value={repOrders.length}
              valueStyle={{ fontWeight: 600, fontSize: '1.5rem', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: '24px' } }} className="rounded-lg shadow-sm border border-slate-200">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <DollarOutlined className="text-emerald-600" /> <span>Total Rep Value (LKR)</span>
                </div>
              }
              value={repTotalValue}
              precision={2}
              valueStyle={{ fontWeight: 600, fontSize: '1.5rem', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: '24px' } }} className="rounded-lg shadow-sm border border-slate-200">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <FileTextOutlined className="text-emerald-600" /> <span>Draft / Confirmed</span>
                </div>
              }
              value={repDraftCount}
              suffix={`/ ${repConfirmedCount}`}
              valueStyle={{ fontWeight: 600, fontSize: '1.5rem', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}
            />
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }} className="rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={repOrders}
          columns={repColumns}
          pagination={{ pageSize: 20, className: 'px-4 py-3 border-t border-slate-100 m-0' }}
          locale={{ emptyText: 'No rep orders recorded for this date.' }}
          className="spiceflow-table"
        />
      </Card>

      <Title level={4} className="mt-8 mb-4">Today's Deliveries</Title>
      <Row gutter={[16, 16]} className="w-full mb-6 mx-0">
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: '24px' } }} className="rounded-lg shadow-sm border border-slate-200">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <TruckOutlined className="text-emerald-600" /> <span>Total Deliveries</span>
                </div>
              }
              value={deliveries.length}
              valueStyle={{ fontWeight: 600, fontSize: '1.5rem', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: '24px' } }} className="rounded-lg shadow-sm border border-slate-200">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <DollarOutlined className="text-emerald-600" /> <span>Total Sales / Collected (LKR)</span>
                </div>
              }
              value={deliveryTotalCollected}
              precision={2}
              suffix={`/ ${deliveryTotalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              valueStyle={{ fontWeight: 600, fontSize: '1.5rem', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: '24px' } }} className="rounded-lg shadow-sm border border-slate-200">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <FileTextOutlined className="text-emerald-600" /> <span>Completed / In Progress</span>
                </div>
              }
              value={deliveryCompletedCount}
              suffix={`/ ${deliveries.length - deliveryCompletedCount}`}
              valueStyle={{ fontWeight: 600, fontSize: '1.5rem', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}
            />
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }} className="rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={deliveries}
          columns={deliveryColumns}
          pagination={{ pageSize: 20, className: 'px-4 py-3 border-t border-slate-100 m-0' }}
          locale={{ emptyText: 'No deliveries recorded for this date.' }}
          className="spiceflow-table"
        />
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
