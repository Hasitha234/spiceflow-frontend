import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  PlusOutlined,
  ShoppingOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { repOrderApi } from '../api/sales';
import type { RepOrder } from '../types/sales';
import { PermissionGuard, PageLayout, PageHeader, DataTable } from '../components/common';
import dayjs from 'dayjs';
import { ResponsiveModal } from '@/components/common/ResponsiveModal';

const { Title } = Typography;

export function RepOrdersPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<RepOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<RepOrder | null>(null);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);

  const filteredOrders = useMemo(() => {
    if (!searchText) return orders;
    const lower = searchText.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(lower) ||
        o.repName?.toLowerCase().includes(lower)
    );
  }, [orders, searchText]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await repOrderApi.list({ page, size, sort: 'id,desc' });
      setOrders(res?.content || []);
      setTotal(res?.totalElements || 0);
    } catch {
      message.error('Failed to load rep orders');
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns = useMemo(
    () => [
      {
        title: 'Order No',
        dataIndex: 'orderNumber',
        key: 'orderNumber',
        render: (val: string) => <span className="font-mono font-semibold" style={{ color: 'var(--color-primary)' }}>{val || '—'}</span>,
      },
      {
        title: 'Rep',
        key: 'rep',
        render: (_: unknown, record: RepOrder) => (
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {record.repName || <span style={{ color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>Unassigned</span>}
          </span>
        ),
      },
      {
        title: 'Order Date',
        dataIndex: 'orderDate',
        key: 'orderDate',
        render: (val: string) => (
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {val ? dayjs(val).format('YYYY-MM-DD') : <span style={{ color: 'var(--color-text-disabled)' }}>—</span>}
          </span>
        ),
      },
      {
        title: 'Route Area',
        dataIndex: 'routeArea',
        key: 'routeArea',
        render: (val: string) => val ? (
          <span style={{ color: 'var(--color-text-primary)' }}>{val}</span>
        ) : (
          <span style={{ color: 'var(--color-text-disabled)' }}>—</span>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
          const isConfirmed = status === 'CONFIRMED' || status === 'COMPLETED';
          return (
            <Tag
              className="m-0 font-medium"
              style={{
                background: isConfirmed ? 'var(--color-success-subtle)' : 'var(--color-warning-subtle)',
                color: isConfirmed ? 'var(--color-success-text)' : 'var(--color-warning-text)',
                borderColor: isConfirmed ? 'var(--color-success-border)' : 'var(--color-warning-border)',
              }}
            >
              {status || 'DRAFT'}
            </Tag>
          );
        },
      },
      {
        title: 'Net Amount (LKR)',
        dataIndex: 'netAmount',
        key: 'netAmount',
        align: 'right' as const,
        render: (val: number) => (
          <span className="font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'right' as const,
        render: (_: unknown, record: RepOrder) => (
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setSelectedOrder(record)}
              style={{ color: 'var(--color-text-tertiary)' }}
              className="hover:text-emerald-500 transition-colors"
            />
          </Tooltip>
        ),
      },
    ],
    []
  );

  return (
    <PageLayout>
      <PageHeader
        title={t('repOrder.repOrder', 'Rep Orders')}
        extra={
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
            <Input.Search
              placeholder="Search orders..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full sm:w-[280px]"
            />
            <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_SALES_REP', 'ROLE_SALES_MANAGER', 'ROLE_DATA_ENTRY', 'ROLE_OWNER']}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/sales/new')}
                className="font-medium w-full sm:w-auto"
              >
                New Rep Order
              </Button>
            </PermissionGuard>
          </div>
        }
      />

      <DataTable
        rowKey="id"
        isLoading={loading}
        dataSource={filteredOrders}
        columns={columns}
        scroll={{ x: 1000 }}
        pagination={{
          current: page + 1,
          pageSize: size,
          total: total,
          onChange: (p, s) => {
            setPage(p - 1);
            setSize(s);
          },
        }}
      />

      <ResponsiveModal
        title={
          <div className="flex items-center gap-2 text-lg">
            <ShoppingOutlined className="text-emerald-500" />
            <span>View Rep Order Details</span>
          </div>
        }
        open={!!selectedOrder}
        onCancel={() => setSelectedOrder(null)}
        width={900}
        footer={null}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <Row gutter={[16, 16]} className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              <Col xs={24} md={8}>
                <div className="text-xs opacity-70">Order Number</div>
                <div className="font-mono font-bold text-emerald-500 text-base">{selectedOrder.orderNumber || '—'}</div>
              </Col>
              <Col xs={24} md={8}>
                <div className="text-xs opacity-70">Sales Rep</div>
                <div className="font-semibold text-base">{selectedOrder.repName || '—'}</div>
              </Col>
              <Col xs={24} md={8}>
                <div className="text-xs opacity-70">Order Date</div>
                <div className="text-base">{selectedOrder.orderDate ? dayjs(selectedOrder.orderDate).format('YYYY-MM-DD') : '—'}</div>
              </Col>
              <Col xs={24} md={8}>
                <div className="text-xs opacity-70">Route Area</div>
                <div>{((selectedOrder as unknown) as Record<string, unknown>).routeArea as string || '—'}</div>
              </Col>
              <Col xs={24} md={8}>
                <div className="text-xs opacity-70">Status</div>
                <div className="mt-1"><Tag color={selectedOrder.status === 'CONFIRMED' ? 'green' : 'orange'}>{selectedOrder.status}</Tag></div>
              </Col>
              <Col xs={24} md={8}>
                <div className="text-xs opacity-70">Net Amount</div>
                <div className="font-mono font-bold text-base text-emerald-500">
                  LKR {Number(selectedOrder.netAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </Col>
            </Row>

            <div>
              <Title level={5} className="!mb-3">Shops & Items</Title>
              {selectedOrder.shops?.map((shopOrder, idx) => (
                <Card key={idx} size="small" className="mb-4" title={shopOrder.shop?.name || `Shop #${shopOrder.shop?.id}`}>
                  <Table
                    dataSource={shopOrder.items || []}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    scroll={{ x: 600 }}
                    columns={[
                      { title: 'Product', dataIndex: 'productName', key: 'productName' },
                      { title: 'Qty', dataIndex: 'quantity', key: 'qty', align: 'right' },
                      { title: 'Unit Type', dataIndex: 'unitType', key: 'unit', render: (val: string) => <Tag color="purple">{val || 'EACH'}</Tag> },
                      { title: 'Rate (LKR)', dataIndex: 'rate', key: 'rate', align: 'right', render: (val: number) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
                      { title: 'Discount', dataIndex: 'discountAmount', key: 'discount', align: 'right', render: (val: number) => <span className="text-red-400">{Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
                      { title: 'Amount (LKR)', dataIndex: 'amount', key: 'amount', align: 'right', render: (val: number) => <span className="font-mono font-semibold">{Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
                    ]}
                  />
                </Card>
              ))}
              {(!selectedOrder.shops || selectedOrder.shops.length === 0) && (
                <div className="text-center opacity-50 italic">No shops recorded for this order.</div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-black/10 dark:border-white/10">
              <Button onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </PageLayout>
  );
}
