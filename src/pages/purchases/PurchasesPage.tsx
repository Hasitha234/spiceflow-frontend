import { useEffect, useMemo, useState, useCallback } from 'react';
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
import { Controller, useForm, useFieldArray, useWatch, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { purchaseApi } from '../../api/sales';
import { supplierApi, productApi } from '../../api/inventory';
import type { Supplier, Product } from '../../types/inventory';
import type { Purchase } from '../../types/sales';
import { PermissionGuard } from '../../components/common';

const { Title, Text } = Typography;

const schema = z.object({
  invoiceNo: z.string().min(1, 'Invoice number is required'),
  supplierId: z.string().min(1, 'Supplier is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  discountAmount: z.number().min(0).optional(),
  returnsDeductedAmount: z.number().min(0).optional(),
  vatAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
  lineItems: z.array(
    z.object({
      productId: z.string().min(1, 'Product is required'),
      noOfBoxes: z.number().int().min(1, 'Min 1 box'),
      soldQuantity: z.number().int().min(1, 'Min 1 unit'),
      unitType: z.string().min(1, 'Unit type is required'),
      rate: z.number().min(0, 'Rate must be positive'),
    })
  ).min(1, 'At least one line item is required'),
});

type FormValues = z.infer<typeof schema>;

const emptyLineItem = {
  productId: '',
  noOfBoxes: 1,
  soldQuantity: 1,
  unitType: 'BOX',
  rate: 0,
};

export function PurchasesPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      invoiceNo: '',
      supplierId: '',
      invoiceDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'CASH',
      discountAmount: 0,
      returnsDeductedAmount: 0,
      vatAmount: 0,
      notes: '',
      lineItems: [emptyLineItem],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const selectedSupplierId = useWatch({ control, name: 'supplierId' });
  const lineItems = useWatch({ control, name: 'lineItems' });
  const discountAmount = useWatch({ control, name: 'discountAmount' }) || 0;
  const returnsDeductedAmount = useWatch({ control, name: 'returnsDeductedAmount' }) || 0;
  const vatAmount = useWatch({ control, name: 'vatAmount' }) || 0;

  const grossTotal = useMemo(() => {
    if (!lineItems || !Array.isArray(lineItems)) return 0;
    return lineItems.reduce((sum, item) => {
      const qty = Number(item?.soldQuantity) || 0;
      const rate = Number(item?.rate) || 0;
      return sum + qty * rate;
    }, 0);
  }, [lineItems]);

  const netTotal = useMemo(() => {
    return Math.max(0, grossTotal - Number(discountAmount) - Number(returnsDeductedAmount) + Number(vatAmount));
  }, [grossTotal, discountAmount, returnsDeductedAmount, vatAmount]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purchaseRes, supplierRes] = await Promise.all([
        purchaseApi.list({ page: 0, size: 50 }),
        supplierApi.list({ page: 0, size: 100 }),
      ]);
      setPurchases(purchaseRes?.content || []);
      setSuppliers(supplierRes?.content || []);
    } catch {
      message.error('Failed to load purchase data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch supplier products when supplierId changes
  useEffect(() => {
    if (selectedSupplierId && !selectedPurchase) {
      setProductsLoading(true);
      productApi
        .list({ supplierId: selectedSupplierId, page: 0, size: 500 })
        .then((res) => {
          setSupplierProducts(res?.content || []);
        })
        .catch(() => message.error('Failed to load items for the selected supplier'))
        .finally(() => setProductsLoading(false));
    } else {
      setSupplierProducts([]);
    }
  }, [selectedSupplierId, selectedPurchase]);

  const handleProductSelect = (productId: string, index: number) => {
    const product = supplierProducts.find((p) => String(p.id) === String(productId));
    if (product) {
      setValue(`lineItems.${index}.rate`, Number(product.ratePerSoldUnit ?? product.basePrice ?? 0));
      setValue(`lineItems.${index}.unitType`, product.unitType || 'BOX');
      setValue(`lineItems.${index}.soldQuantity`, Number(product.itemsPerSoldUnit ?? 1));
      setValue(`lineItems.${index}.noOfBoxes`, 1);
    }
  };

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
                  setVisible(true);
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

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        supplierId: Number(values.supplierId),
        invoiceNo: values.invoiceNo,
        invoiceDate: values.invoiceDate,
        discountAmount: Number(values.discountAmount || 0),
        returnsDeductedAmount: Number(values.returnsDeductedAmount || 0),
        vatAmount: Number(values.vatAmount || 0),
        paymentMethod: values.paymentMethod || 'CASH',
        notes: values.notes || '',
        lineItems: values.lineItems.map((item) => ({
          productId: Number(item.productId),
          noOfBoxes: Number(item.noOfBoxes || 1),
          soldQuantity: Number(item.soldQuantity || 1),
          unitType: item.unitType || 'BOX',
          rate: Number(item.rate || 0),
        })),
      };

      await purchaseApi.create(payload);
      message.success('Purchase Order created successfully');
      setVisible(false);
      reset();
      loadData();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string; message?: string } } };
      const msg = errorObj?.response?.data?.detail || errorObj?.response?.data?.message || 'Failed to create purchase order';
      message.error(msg);
    }
  };

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
                setSelectedPurchase(null);
                reset({
                  invoiceNo: '',
                  supplierId: '',
                  invoiceDate: new Date().toISOString().slice(0, 10),
                  paymentMethod: 'CASH',
                  discountAmount: 0,
                  returnsDeductedAmount: 0,
                  vatAmount: 0,
                  notes: '',
                  lineItems: [emptyLineItem],
                });
                setVisible(true);
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
            <span>{selectedPurchase ? 'View Purchase Order' : 'Create Purchase Order'}</span>
          </div>
        }
        open={visible}
        onCancel={() => setVisible(false)}
        width={950}
        footer={null}
      >
        {selectedPurchase ? (
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
              <Button onClick={() => setVisible(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <Form layout="vertical" onFinish={handleSubmit(onSubmit as unknown as SubmitHandler<FormValues>)} className="space-y-4">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Supplier"
                  validateStatus={errors.supplierId ? 'error' : ''}
                  help={errors.supplierId?.message}
                  required
                >
                  <Controller
                    name="supplierId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        placeholder="Select supplier"
                        options={suppliers.map((s) => ({ value: String(s.id), label: s.name }))}
                        showSearch
                        optionFilterProp="label"
                        className="w-full"
                        onChange={(val) => {
                          field.onChange(val);
                          // Reset line items when supplier changes
                          setValue('lineItems', [emptyLineItem]);
                        }}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Invoice No"
                  validateStatus={errors.invoiceNo ? 'error' : ''}
                  help={errors.invoiceNo?.message}
                  required
                >
                  <Controller
                    name="invoiceNo"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="e.g. INV-2026-001" />}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Invoice Date"
                  validateStatus={errors.invoiceDate ? 'error' : ''}
                  help={errors.invoiceDate?.message}
                  required
                >
                  <Controller
                    name="invoiceDate"
                    control={control}
                    render={({ field }) => <Input type="date" {...field} />}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Payment Method">
                  <Controller
                    name="paymentMethod"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={[
                          { label: 'Cash', value: 'CASH' },
                          { label: 'Credit', value: 'CREDIT' },
                          { label: 'Cheque', value: 'CHEQUE' },
                          { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
                        ]}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item label="Notes">
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Optional purchase notes..." />}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider className="!my-2" />

            <div>
              <div className="flex justify-between items-center mb-3">
                <Title level={5} className="!m-0">
                  Line Items (Supplier Catalog)
                </Title>
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => append(emptyLineItem)}
                  disabled={!selectedSupplierId}
                >
                  Add Item
                </Button>
              </div>

              {!selectedSupplierId ? (
                <Alert
                  type="info"
                  showIcon
                  message="Select a Supplier First"
                  description="Please select a supplier above to view and select their available catalog items."
                  className="mb-4"
                />
              ) : productsLoading ? (
                <div className="p-6 text-center opacity-70 bg-black/5 dark:bg-white/5 rounded-lg">Loading supplier items...</div>
              ) : supplierProducts.length === 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  message="No Products Sourced From This Supplier"
                  description="This supplier currently has no products linked to them in the system. Go to Suppliers -> Catalog to add items to this supplier first."
                  className="mb-4"
                />
              ) : null}

              <div className="space-y-3">
                {fields.map((field, index) => {
                  const qty = Number(lineItems?.[index]?.soldQuantity) || 0;
                  const rate = Number(lineItems?.[index]?.rate) || 0;
                  const rowAmount = qty * rate;

                  return (
                    <div
                      key={field.id}
                      className="p-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg flex flex-wrap items-center gap-3"
                    >
                      <div className="flex-1 min-w-[200px]">
                        <div className="text-xs opacity-70 mb-1">Product</div>
                        <Controller
                          name={`lineItems.${index}.productId`}
                          control={control}
                          render={({ field: f }) => (
                            <Select
                              {...f}
                              placeholder="Select item"
                              disabled={!selectedSupplierId}
                              options={supplierProducts.map((p) => ({
                                value: String(p.id),
                                label: `${p.sku ? `[${p.sku}] ` : ''}${p.name}`,
                              }))}
                              showSearch
                              optionFilterProp="label"
                              className="w-full"
                              onChange={(val) => {
                                f.onChange(val);
                                handleProductSelect(val, index);
                              }}
                            />
                          )}
                        />
                      </div>

                      <div className="w-24">
                        <div className="text-xs opacity-70 mb-1">Boxes</div>
                        <Controller
                          name={`lineItems.${index}.noOfBoxes`}
                          control={control}
                          render={({ field: f }) => (
                            <InputNumber {...f} min={1} className="w-full" />
                          )}
                        />
                      </div>

                      <div className="w-24">
                        <div className="text-xs opacity-70 mb-1">Quantity</div>
                        <Controller
                          name={`lineItems.${index}.soldQuantity`}
                          control={control}
                          render={({ field: f }) => (
                            <InputNumber {...f} min={1} className="w-full" />
                          )}
                        />
                      </div>

                      <div className="w-28">
                        <div className="text-xs opacity-70 mb-1">Unit Type</div>
                        <Controller
                          name={`lineItems.${index}.unitType`}
                          control={control}
                          render={({ field: f }) => (
                            <Input {...f} placeholder="BOX" className="w-full font-mono text-xs" />
                          )}
                        />
                      </div>

                      <div className="w-32">
                        <div className="text-xs opacity-70 mb-1">Rate (LKR)</div>
                        <Controller
                          name={`lineItems.${index}.rate`}
                          control={control}
                          render={({ field: f }) => (
                            <InputNumber {...f} min={0} step={0.01} precision={2} className="w-full" />
                          )}
                        />
                      </div>

                      <div className="w-32 text-right">
                        <div className="text-xs opacity-70 mb-1">Amount</div>
                        <div className="font-mono font-semibold py-1">
                          {rowAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="pt-5">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Divider className="!my-4" />

            {/* Financial Summary */}
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg border border-black/10 dark:border-white/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="opacity-80">Gross Total:</span>
                <span className="font-mono">LKR {grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-80">Discount Amount (-) :</span>
                <Controller
                  name="discountAmount"
                  control={control}
                  render={({ field }) => (
                    <InputNumber {...field} min={0} step={0.01} precision={2} className="w-36" />
                  )}
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-80">Returns Deducted (-) :</span>
                <Controller
                  name="returnsDeductedAmount"
                  control={control}
                  render={({ field }) => (
                    <InputNumber {...field} min={0} step={0.01} precision={2} className="w-36" />
                  )}
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-80">VAT Amount (+) :</span>
                <Controller
                  name="vatAmount"
                  control={control}
                  render={({ field }) => (
                    <InputNumber {...field} min={0} step={0.01} precision={2} className="w-36" />
                  )}
                />
              </div>
              <Divider className="!my-2" />
              <div className="flex justify-between text-base font-bold text-emerald-500">
                <span>Net Total Amount:</span>
                <span className="font-mono text-lg">LKR {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
              <Button onClick={() => setVisible(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                {t('common.save', 'Create Purchase Order')}
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
}
