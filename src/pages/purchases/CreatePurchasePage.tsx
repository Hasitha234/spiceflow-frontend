import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Typography,
  message,
  Skeleton,
  Card,
  Space
} from 'antd';
import { ShoppingOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { purchaseApi } from '../../api/sales';
import { productApi, supplierApi, warehouseApi } from '../../api/inventory';
import type { Supplier, Product, Warehouse } from '../../types/inventory';
import type { PurchaseLineItem, PurchaseReturnItem } from '../../types/sales';
import { PurchaseLineItemGrid } from './components/PurchaseLineItemGrid';
import { PurchaseReturnItemGrid } from './components/PurchaseReturnItemGrid';

const { Title, Text } = Typography;

const purchaseSchema = z.object({
  invoiceNo: z.string().min(1, 'Invoice number is required'),
  supplierId: z.string().min(1, 'Supplier is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  chequeNo: z.string().optional(),
  chequeBankName: z.string().optional(),
  chequeAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  returnsDeductedAmount: z.number().min(0).optional(),
  vatAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product is required'),
        noOfBoxes: z.number().int().min(1, 'Min 1 box'),
        soldQuantity: z.number().int().min(1, 'Min 1 unit'),
        unitType: z.string().min(1, 'Unit type is required'),
        rate: z.number().min(0, 'Rate must be positive'),
        amount: z.number().min(0, 'Amount must be positive').optional(),
      })
    )
    .min(1, 'At least one line item is required'),
  returnWarehouseId: z.string().optional(),
  returnItems: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product is required'),
        quantity: z.number().int().min(1, 'Min 1 unit'),
        unitType: z.string().min(1, 'Unit type is required'),
        rate: z.number().min(0, 'Rate must be positive'),
        amount: z.number().min(0, 'Amount must be positive').optional(),
      })
    ).optional(),
});

export type FormValues = z.infer<typeof purchaseSchema>;

import { emptyLineItem } from './constants';

type CatalogStatus = 'idle' | 'loading' | 'success' | 'error';

export function CreatePurchasePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>('idle');
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(purchaseSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      invoiceNo: '',
      supplierId: '',
      invoiceDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'CASH',
      chequeNo: '',
      chequeBankName: '',
      chequeAmount: 0,
      discountAmount: 0,
      returnsDeductedAmount: 0,
      vatAmount: 0,
      notes: '',
      lineItems: [emptyLineItem],
      returnItems: [],
    },
  });

  const paymentMethod = useWatch({ control, name: 'paymentMethod' });
  const selectedSupplierId = useWatch({ control, name: 'supplierId' });
  const lineItems = useWatch({ control, name: 'lineItems' });
  const returnItems = useWatch({ control, name: 'returnItems' });
  const discountAmount = useWatch({ control, name: 'discountAmount' }) || 0;
  const returnsDeductedAmount = useWatch({ control, name: 'returnsDeductedAmount' }) || 0;
  const vatAmount = useWatch({ control, name: 'vatAmount' }) || 0;

  useEffect(() => {
    supplierApi.list({ page: 0, size: 500 }).then((res) => {
      setSuppliers(res?.content || []);
    }).catch(() => {
      message.error('Failed to load suppliers');
    });
    warehouseApi.list({ page: 0, size: 500 }).then((res) => {
      setWarehouses(res?.content || []);
    }).catch(() => {
      message.error('Failed to load warehouses');
    });
  }, []);

  useEffect(() => {
    if (selectedSupplierId) {
      setCatalogStatus('loading');
      productApi
        .list({ supplierId: selectedSupplierId, page: 0, size: 500 })
        .then((res) => {
          setSupplierProducts(res?.content || []);
          setCatalogStatus('success');
        })
        .catch(() => {
          message.error('Failed to load product catalog');
          setCatalogStatus('error');
        });
    } else {
      setSupplierProducts([]);
      setCatalogStatus('idle');
    }
  }, [selectedSupplierId]);

  useEffect(() => {
    if (returnItems && Array.isArray(returnItems)) {
      const sum = returnItems.reduce((acc, item) => {
        const qty = Number(item?.quantity) || 0;
        const rate = Number(item?.rate) || 0;
        const amount = item?.amount !== undefined ? Number(item.amount) : qty * rate;
        return acc + amount;
      }, 0);
      setValue('returnsDeductedAmount', Number(sum.toFixed(2)));
    }
  }, [returnItems, setValue]);

  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode && id) {
      const loadPurchase = async () => {
        try {
          const purchase = await purchaseApi.get(id);
          reset({
            invoiceNo: purchase.invoiceNo,
            supplierId: purchase.supplierId?.toString(),
            invoiceDate: purchase.invoiceDate,
            paymentMethod: purchase.paymentMethod,
            chequeNo: purchase.chequeNo,
            chequeBankName: purchase.chequeBankName,
            chequeAmount: purchase.chequeAmount,
            discountAmount: purchase.discountAmount,
            returnsDeductedAmount: purchase.returnsDeductedAmount,
            vatAmount: purchase.vatAmount,
            notes: purchase.notes,
            lineItems: purchase.lineItems?.map((li: PurchaseLineItem) => ({
              productId: li.productId?.toString(),
              noOfBoxes: li.noOfBoxes,
              soldQuantity: li.soldQuantity,
              unitType: li.unitType,
              rate: li.rate,
              amount: li.amount,
            })) || [],
            returnWarehouseId: purchase.returnWarehouseId?.toString(),
            returnItems: purchase.returnItems?.map((ri: PurchaseReturnItem) => ({
              productId: ri.productId?.toString(),
              quantity: ri.quantity,
              unitType: ri.unitType,
              rate: ri.rate,
              amount: ri.amount,
            })) || [],
          });
        } catch {
          message.error('Failed to load purchase details');
          navigate('/purchases');
        }
      };
      loadPurchase();
    }
  }, [id, isEditMode, reset, navigate]);

  const grossTotal = useMemo(() => {
    if (!lineItems || !Array.isArray(lineItems)) return 0;
    return lineItems.reduce((sum, item) => {
      const qty = Number(item?.soldQuantity) || 0;
      const rate = Number(item?.rate) || 0;
      const amount = item?.amount !== undefined ? Number(item.amount) : qty * rate;
      return sum + amount;
    }, 0);
  }, [lineItems]);

  const netTotal = useMemo(() => {
    return Math.max(
      0,
      grossTotal - Number(discountAmount) - Number(returnsDeductedAmount) + Number(vatAmount)
    );
  }, [grossTotal, discountAmount, returnsDeductedAmount, vatAmount]);

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
        chequeNo: values.paymentMethod === 'CHEQUE' ? values.chequeNo : null,
        chequeBankName: values.paymentMethod === 'CHEQUE' ? values.chequeBankName : null,
        chequeAmount: values.paymentMethod === 'CHEQUE' ? (values.chequeAmount || netTotal) : null,
        notes: values.notes || '',
        lineItems: values.lineItems.map((item) => ({
          productId: Number(item.productId),
          noOfBoxes: Number(item.noOfBoxes || 1),
          soldQuantity: Number(item.soldQuantity || 1),
          unitType: item.unitType || 'BOX',
          rate: Number(item.rate || 0),
          amount: item.amount !== undefined ? Number(item.amount) : undefined,
        })),
        returnWarehouseId: values.returnWarehouseId ? Number(values.returnWarehouseId) : null,
        returnItems: values.returnItems?.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity || 1),
          unitType: item.unitType || 'BOX',
          rate: Number(item.rate || 0),
          amount: item.amount !== undefined ? Number(item.amount) : undefined,
        })) || [],
      };

      if (isEditMode && id) {
        await purchaseApi.update(id, payload);
        message.success('Purchase updated successfully');
      } else {
        await purchaseApi.create(payload);
        message.success('Purchase created successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/purchases');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail ||
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.message ||
        'Failed to process purchase order';
      message.error(msg);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-base)', paddingBottom: '120px' }}>
      {/* Top Header Navigation */}
      <div style={{ backgroundColor: 'var(--surface-raised)', borderBottom: '1px solid var(--surface-border)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/purchases')}
          className="text-slate-500 hover:text-slate-900"
        />
        <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>{isEditMode ? 'Edit Purchase Order' : 'New Purchase Order'}</Title>
      </div>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header Metadata Section */}
        <Card variant="borderless" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--surface-border)' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                label={<Text strong style={{ color: 'var(--text-secondary)' }}>Supplier</Text>}
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
                      size="middle"
                      placeholder="Select supplier"
                      options={suppliers.map((s) => ({ value: String(s.id), label: s.name }))}
                      showSearch
                      optionFilterProp="label"
                      style={{ width: '100%' }}
                      onChange={(val) => {
                        field.onChange(val);
                        setValue('lineItems', [emptyLineItem]);
                      }}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={<Text strong style={{ color: 'var(--text-secondary)' }}>Invoice No</Text>}
                validateStatus={errors.invoiceNo ? 'error' : ''}
                help={errors.invoiceNo?.message}
                required
              >
                <Controller
                  name="invoiceNo"
                  control={control}
                  render={({ field }) => <Input size="middle" {...field} placeholder="INV-2026-001" style={{ width: '100%' }} />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={<Text strong style={{ color: 'var(--text-secondary)' }}>Invoice Date</Text>}
                validateStatus={errors.invoiceDate ? 'error' : ''}
                help={errors.invoiceDate?.message}
                required
              >
                <Controller
                  name="invoiceDate"
                  control={control}
                  render={({ field }) => <Input type="date" size="middle" {...field} style={{ width: '100%' }} />}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col xs={24} md={8}>
              <Form.Item label={<Text strong style={{ color: 'var(--text-secondary)' }}>Payment Method</Text>}>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      size="middle"
                      style={{ width: '100%' }}
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
            
            {paymentMethod === 'CHEQUE' && (
              <>
                <Col xs={24} md={8}>
                  <Form.Item label={<Text strong style={{ color: 'var(--text-secondary)' }}>Cheque Number</Text>}>
                    <Controller
                      name="chequeNo"
                      control={control}
                      render={({ field }) => <Input size="middle" {...field} placeholder="CHQ-123456" style={{ width: '100%' }} />}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label={<Text strong style={{ color: 'var(--text-secondary)' }}>Bank Name</Text>}>
                    <Controller
                      name="chequeBankName"
                      control={control}
                      render={({ field }) => <Input size="middle" {...field} placeholder="Commercial Bank" style={{ width: '100%' }} />}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label={<Text strong style={{ color: 'var(--text-secondary)' }}>Cheque Amount</Text>} extra={<span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>If left 0, it auto-fills with Net Total</span>}>
                    <Controller
                      name="chequeAmount"
                      control={control}
                      render={({ field }) => <InputNumber onFocus={(e) => e.target.select()} size="middle" {...field} min={0} step={0.01} precision={2} style={{ width: '100%' }} placeholder="Amount" />}
                    />
                  </Form.Item>
                </Col>
              </>
            )}

            <Col xs={24} md={paymentMethod === 'CHEQUE' ? 24 : 16}>
              <Form.Item label={<Text strong style={{ color: 'var(--text-secondary)' }}>Notes (Optional)</Text>}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => <Input size="middle" {...field} placeholder="Add any relevant purchasing notes here..." style={{ width: '100%' }} />}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col xs={24} md={8}>
              <Form.Item label={<Text strong style={{ color: 'var(--text-secondary)' }}>Return Warehouse (Optional)</Text>} tooltip="Select if there are returned items in this purchase">
                <Controller
                  name="returnWarehouseId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      size="middle"
                      placeholder="Select a warehouse for returns"
                      options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
                      style={{ width: '100%' }}
                      allowClear
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Data Grid Section */}
        <Card 
          bordered={false} 
          style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--surface-border)' }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--surface-border)', backgroundColor: 'var(--surface-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={5} style={{ margin: 0 }}>Line Items</Title>
              <Text type="secondary">Add items from the supplier's catalog</Text>
            </div>
            {catalogStatus === 'loading' && <Text style={{ color: 'var(--color-emerald-500)' }}>Syncing catalog...</Text>}
          </div>

          <div style={{ overflowX: 'auto' }}>
            {catalogStatus === 'idle' ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <ShoppingOutlined style={{ fontSize: '36px', color: 'var(--text-muted)', marginBottom: '12px' }} />
                <br/>
                <Text strong style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Select a supplier to begin.</Text>
                <br/>
                <Text type="secondary">The product catalog will load automatically.</Text>
              </div>
            ) : catalogStatus === 'loading' ? (
              <div style={{ padding: '24px' }}>
                <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                  <Skeleton.Input active block size="large" />
                  <Skeleton.Input active block size="large" />
                  <Skeleton.Input active block size="large" />
                </Space>
              </div>
            ) : catalogStatus === 'error' ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-danger)' }}>
                Failed to load the catalog. Please refresh or select the supplier again.
              </div>
            ) : (
              <PurchaseLineItemGrid 
                control={control} 
                setValue={setValue} 
                supplierProducts={supplierProducts}
                setSupplierProducts={setSupplierProducts}
                errors={errors}
              />
            )}
          </div>
        </Card>

        {/* Returns Data Grid Section */}
        <Card 
          bordered={false} 
          style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--surface-border)' }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--surface-border)', backgroundColor: 'var(--surface-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={5} style={{ margin: 0 }}>Return Items</Title>
              <Text type="secondary">Items returned to the supplier (deducted from total)</Text>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            {catalogStatus === 'idle' ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                 <Text type="secondary">Select a supplier to add return items.</Text>
              </div>
            ) : (
              <PurchaseReturnItemGrid 
                control={control} 
                setValue={setValue} 
                supplierProducts={supplierProducts} 
                errors={errors}
              />
            )}
          </div>
        </Card>

        {/* Floating Bottom Bar (Sticky Footer) */}
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          backgroundColor: 'var(--surface-raised)', 
          borderTop: '1px solid var(--surface-border)', 
          boxShadow: '0 -4px 6px -1px rgba(15, 23, 42, 0.05)', 
          zIndex: 20 
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Financial Adjustments */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Gross</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontFeatureSettings: "'tnum'", fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div style={{ height: '32px', width: '1px', backgroundColor: '#f0f0f0' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Discount (-)</span>
                <Controller
                  name="discountAmount"
                  control={control}
                  render={({ field }) => (
                    <InputNumber onFocus={(e) => e.target.select()} {...field} min={0} step={0.01} precision={2} style={{ padding: '4px 0', backgroundColor: 'transparent', fontFamily: 'monospace', fontSize: '1rem', fontWeight: 500, width: '120px', color: 'var(--text-primary)', border: 'none', borderBottom: '1px solid #E2E8F0', borderRadius: 0, boxShadow: 'none' }} placeholder="0.00" />
                  )}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Returns (-)</span>
                <Controller
                  name="returnsDeductedAmount"
                  control={control}
                  render={({ field }) => (
                    <InputNumber onFocus={(e) => e.target.select()} {...field} min={0} step={0.01} precision={2} style={{ padding: '4px 0', backgroundColor: 'transparent', fontFamily: 'monospace', fontSize: '1rem', fontWeight: 500, width: '120px', color: 'var(--text-primary)', border: 'none', borderBottom: '1px solid #E2E8F0', borderRadius: 0, boxShadow: 'none' }} placeholder="0.00" />
                  )}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>VAT (+)</span>
                <Controller
                  name="vatAmount"
                  control={control}
                  render={({ field }) => (
                    <InputNumber onFocus={(e) => e.target.select()} {...field} min={0} step={0.01} precision={2} style={{ padding: '4px 0', backgroundColor: 'transparent', fontFamily: 'monospace', fontSize: '1rem', fontWeight: 500, width: '120px', color: 'var(--text-primary)', border: 'none', borderBottom: '1px solid #E2E8F0', borderRadius: 0, boxShadow: 'none' }} placeholder="0.00" />
                  )}
                />
              </div>
            </div>

            {/* Net Total & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Net Total</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>LKR</span>
                  <span style={{ fontFeatureSettings: "'tnum'", fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-emerald-600)' }}>
                    {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              
              <Button size="large" onClick={() => navigate('/purchases')} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button size="large" type="primary" htmlType="submit" loading={isSubmitting}>
                {isEditMode ? 'Update Order' : 'Submit Order'}
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}

