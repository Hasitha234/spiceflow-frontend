import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { purchaseApi } from '../../api/sales';
import { supplierApi, productApi } from '../../api/inventory';
import type { Supplier, Product } from '../../types/inventory';
import type { Purchase } from '../../types/sales';
import { PermissionGuard } from '../../components/common';

const { Title, Text } = Typography;

export function PurchasesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const purchaseRes = await purchaseApi.list({ page: 0, size: 50 });
      setPurchases(purchaseRes?.content || []);
    } catch {
      message.error('Failed to load purchase data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);



  const handleConfirm = useCallback(async (id: string) => {
    try {
      await purchaseApi.confirm(id);
      message.success('Purchase Order confirmed successfully');
      loadData();
    } catch {
      message.error('Failed to confirm purchase order');
    }
  }, []);

  const columns = useMemo(
    () => [
      {
        title: t('purchase.invoiceNo', 'Invoice No'),
        dataIndex: 'invoiceNo',
        key: 'invoiceNo',
        render: (val: string) => <span className="font-mono text-emerald-400 font-semibold">{val || '—'}</span>,
      },
      {
        title: t('purchase.supplier', 'Supplier'),
        key: 'supplier',
        render: (_: unknown, record: Purchase) => (
          <span className="font-medium text-slate-200">
            {record.supplierName || record.supplier?.name || '—'}
          </span>
        ),
      },
      {
        title: t('purchase.purchaseDate', 'Invoice Date'),
        key: 'invoiceDate',
        render: (_: unknown, record: Purchase) => (
          <span className="text-slate-300">{record.invoiceDate || record.purchaseDate || '—'}</span>
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
          return <span className="font-mono text-slate-100 font-semibold">{Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
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
                onClick={() => {
                  setSelectedPurchase(record);
                }}
                className="!text-blue-400 hover:!text-blue-300"
              />
            </Tooltip>
            {record.status === 'DRAFT' && (
              <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_PURCHASING_AGENT', 'ROLE_INVENTORY_MANAGER']}>
                <Tooltip title="Confirm Purchase Order">
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleConfirm(record.id)}
                    className="!text-emerald-400 hover:!text-emerald-300"
                  />
                </Tooltip>
              </PermissionGuard>
            )}
          </Space>
        ),
      },
    ],
    [t, handleConfirm]
  );



  return (
    <div className="p-6">
      <Row justify="space-between" align="middle" className="mb-6">
        <Col>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500">
              <ShoppingOutlined className="text-2xl" />
            </div>
            <div>
              <Title level={3} className="!m-0">
                {t('purchase.title', 'Purchase Orders')}
              </Title>
              <Text type="secondary">
                Manage supplier invoices and receive inventory items
              </Text>
            </div>
          </div>
        </Col>
        <Col>
          <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_PURCHASING_AGENT', 'ROLE_INVENTORY_MANAGER']}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                navigate('/purchases/new');
              }}
              className="font-medium h-10 px-5"
            >
              {t('purchase.create', 'New Purchase Order')}
            </Button>
          </PermissionGuard>
        </Col>
      </Row>

      <Card className="shadow-xl rounded-xl overflow-hidden">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={purchases}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg">
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
                <div className="mt-1"><Tag color={selectedPurchase.status === 'CONFIRMED' ? 'green' : 'orange'}>{selectedPurchase.status}</Tag></div>
              </Col>
              <Col span={8}>
                <div className="text-xs opacity-70">Payment Method</div>
                <div>{selectedPurchase.paymentMethod || 'CASH'}</div>
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
