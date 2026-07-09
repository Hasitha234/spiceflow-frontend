import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { purchaseApi } from '../../api/sales';
import { warehouseApi } from '../../api/inventory';
import type { Warehouse } from '../../types/inventory';
import type { Purchase } from '../../types/sales';
import { PermissionGuard } from '../../components/common';

const { Title, Text } = Typography;

export function PurchasesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Warehouse selection state
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmingPurchaseId, setConfirmingPurchaseId] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);

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
    // Load warehouses for confirmation dropdown
    warehouseApi.list({ size: 100 }).then(res => setWarehouses(res?.content || [])).catch(() => {});
  }, []);

  const handleConfirmClick = useCallback((id: string) => {
    setConfirmingPurchaseId(id);
    setConfirmModalVisible(true);
    setSelectedWarehouseId(null);
  }, []);

  const submitConfirm = async () => {
    if (!confirmingPurchaseId || !selectedWarehouseId) {
      message.error('Please select a warehouse');
      return;
    }
    try {
      await purchaseApi.confirm(confirmingPurchaseId, selectedWarehouseId);
      message.success('Purchase Order confirmed successfully');
      setConfirmModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      loadData();
    } catch (e: any) {
      const errorMsg = e?.response?.data?.detail || e?.response?.data?.message || 'Failed to confirm purchase order';
      message.error(errorMsg);
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    try {
      await purchaseApi.delete(id);
      message.success('Purchase Order deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      loadData();
    } catch {
      message.error('Failed to delete purchase order');
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
                <Tooltip title="Edit Purchase Order">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/purchases/${record.id}/edit`)}
                    className="!text-orange-400 hover:!text-orange-300"
                  />
                </Tooltip>
                <Tooltip title="Confirm Purchase Order">
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleConfirmClick(record.id)}
                    className="!text-emerald-400 hover:!text-emerald-300"
                  />
                </Tooltip>
                <Popconfirm
                  title="Are you sure you want to delete this purchase order?"
                  onConfirm={() => handleDelete(record.id)}
                  okText="Yes"
                  cancelText="No"
                  placement="topLeft"
                >
                  <Tooltip title="Delete Purchase Order">
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      className="!text-red-400 hover:!text-red-300"
                    />
                  </Tooltip>
                </Popconfirm>
              </PermissionGuard>
            )}
          </Space>
        ),
      },
    ],
    [t, handleConfirmClick, handleDelete]
  );



  return (
    <div className="p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Title level={2} style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
            {t('purchase.title', 'Purchase Orders')}
          </Title>
          <Text style={{ fontSize: '0.875rem', marginTop: '0.5rem', display: 'block', color: 'var(--text-secondary)' }}>
            Manage supplier invoices and receive inventory items
          </Text>
        </div>
        <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_PURCHASING_AGENT', 'ROLE_INVENTORY_MANAGER']}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              navigate('/purchases/new');
            }}
            style={{ fontWeight: 500, height: '40px', padding: '0 1rem', borderRadius: '6px' }}
          >
            {t('purchase.create', 'New Purchase Order')}
          </Button>
        </PermissionGuard>
      </div>

      <Card style={{ borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--surface-border)' }} className="overflow-hidden">
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

            {selectedPurchase.paymentMethod === 'CHEQUE' && (
              <Row gutter={[16, 16]} className="p-4 mt-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                <Col span={24}>
                  <div className="font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                    <span className="text-xl">💳</span> Cheque Details
                  </div>
                </Col>
                <Col span={8}>
                  <div className="text-xs opacity-70">Cheque Number</div>
                  <div className="font-mono font-medium">{selectedPurchase.chequeNo || '—'}</div>
                </Col>
                <Col span={8}>
                  <div className="text-xs opacity-70">Bank Name</div>
                  <div className="font-medium">{selectedPurchase.chequeBankName || '—'}</div>
                </Col>
                <Col span={8}>
                  <div className="text-xs opacity-70">Cheque Amount</div>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    LKR {Number(selectedPurchase.chequeAmount ?? selectedPurchase.netAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </Col>
              </Row>
            )}

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
        title="Confirm Purchase Order"
        open={confirmModalVisible}
        onOk={submitConfirm}
        onCancel={() => setConfirmModalVisible(false)}
        okText="Confirm & Receive Stock"
        okButtonProps={{ disabled: !selectedWarehouseId }}
      >
        <p>Please select the warehouse where the inventory should be received:</p>
        <Select
          style={{ width: '100%' }}
          placeholder="Select a warehouse"
          value={selectedWarehouseId}
          onChange={setSelectedWarehouseId}
          options={warehouses.map(w => ({
            label: `${w.name} (${w.storeType})`,
            value: w.id
          }))}
        />
      </Modal>

    </div>
  );
}
