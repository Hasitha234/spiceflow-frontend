import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Col, DatePicker, Row, Statistic, Table, Tag, Typography, message, Space, Button, Tooltip, Modal } from 'antd';
import { ShoppingOutlined, DollarOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { purchaseApi } from '../api/sales';
import type { Purchase } from '../types/sales';

const { Title, Text } = Typography;

export function DaySummaryPage() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const loadData = useCallback(async (date: dayjs.Dayjs) => {
    setLoading(true);
    try {
      const res = await purchaseApi.list({ 
        date: date.format('YYYY-MM-DD'),
        size: 100 // Load enough to cover a typical day
      });
      setPurchases(res?.content || []);
    } catch {
      message.error('Failed to load purchases for the selected date');
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
    </div>
  );
}
