import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Col,
  Row,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  ShoppingOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { repOrderApi } from '../api/sales';
import type { RepOrder } from '../types/sales';
import { PermissionGuard } from '../components/common';
import dayjs from 'dayjs';

const { Title } = Typography;

export function RepOrdersPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<RepOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<RepOrder | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await repOrderApi.list({ page: 0, size: 50 });
      setOrders(res?.content || []);
    } catch {
      message.error('Failed to load rep orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = useMemo(
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
          <span className="font-medium text-slate-200">
            {record.repName || '—'}
          </span>
        ),
      },
      {
        title: 'Order Date',
        dataIndex: 'orderDate',
        key: 'orderDate',
        render: (val: string) => <span className="text-slate-300">{val ? dayjs(val).format('YYYY-MM-DD') : '—'}</span>,
      },
      {
        title: 'Route Area',
        dataIndex: 'routeArea',
        key: 'routeArea',
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
        title: 'Net Amount (LKR)',
        dataIndex: 'netAmount',
        key: 'netAmount',
        align: 'right' as const,
        render: (val: number) => (
          <span className="font-mono text-slate-100 font-semibold">
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
              className="!text-blue-400 hover:!text-blue-300"
            />
          </Tooltip>
        ),
      },
    ],
    []
  );

  return (
    <div className="p-6">
      <Row justify="space-between" align="middle" style={{ marginBottom: '32px' }}>
        <Col>
          <div>
            <Title level={3} className="!m-0">
              {t('repOrder.repOrder', 'Rep Orders')}
            </Title>
          </div>
        </Col>
        <Col>
          <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_SALES_REP', 'ROLE_SALES_MANAGER']}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/sales/new')}
              className="font-medium h-10 px-5"
            >
              New Rep Order
            </Button>
          </PermissionGuard>
        </Col>
      </Row>

      <Card className="shadow-xl rounded-xl overflow-hidden">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={orders}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
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
              <Col span={8}>
                <div className="text-xs opacity-70">Order Number</div>
                <div className="font-mono font-bold text-emerald-500 text-base">{selectedOrder.orderNumber || '—'}</div>
              </Col>
              <Col span={8}>
                <div className="text-xs opacity-70">Sales Rep</div>
                <div className="font-semibold text-base">{selectedOrder.repName || '—'}</div>
              </Col>
              <Col span={8}>
                <div className="text-xs opacity-70">Order Date</div>
                <div className="text-base">{selectedOrder.orderDate ? dayjs(selectedOrder.orderDate).format('YYYY-MM-DD') : '—'}</div>
              </Col>
              <Col span={8}>
                <div className="text-xs opacity-70">Route Area</div>
                <div>{((selectedOrder as unknown) as Record<string, unknown>).routeArea as string || '—'}</div>
              </Col>
              <Col span={8}>
                <div className="text-xs opacity-70">Status</div>
                <div className="mt-1"><Tag color={selectedOrder.status === 'CONFIRMED' ? 'green' : 'orange'}>{selectedOrder.status}</Tag></div>
              </Col>
              <Col span={8}>
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
      </Modal>
    </div>
  );
}
