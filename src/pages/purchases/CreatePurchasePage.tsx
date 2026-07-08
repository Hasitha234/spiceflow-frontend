import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Space,
  Divider
} from 'antd';
import { ShoppingOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { purchaseApi } from '../../api/sales';
import { productApi, supplierApi } from '../../api/inventory';
import type { Supplier, Product } from '../../types/inventory';
import { PurchaseLineItemGrid } from './components/PurchaseLineItemGrid';

const { Title, Text } = Typography;

export const purchaseSchema = z.object({
  invoiceNo: z.string().min(1, 'Invoice number is required'),
  supplierId: z.string().min(1, 'Supplier is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
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
      })
    )
    .min(1, 'At least one line item is required'),
});

export type FormValues = z.infer<typeof purchaseSchema>;

export const emptyLineItem = {
  productId: '',
  noOfBoxes: 1,
  soldQuantity: 1,
  unitType: 'BOX',
  rate: 0,
};

type CatalogStatus = 'idle' | 'loading' | 'success' | 'error';

export function CreatePurchasePage() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>('idle');
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(purchaseSchema) as unknown as Resolver<FormValues>,
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

  const selectedSupplierId = useWatch({ control, name: 'supplierId' });
  const lineItems = useWatch({ control, name: 'lineItems' });
  const discountAmount = useWatch({ control, name: 'discountAmount' }) || 0;
  const returnsDeductedAmount = useWatch({ control, name: 'returnsDeductedAmount' }) || 0;
  const vatAmount = useWatch({ control, name: 'vatAmount' }) || 0;

  useEffect(() => {
    supplierApi.list({ page: 0, size: 500 }).then((res) => {
      setSuppliers(res?.content || []);
    }).catch(() => {
      message.error('Failed to load suppliers');
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

  const grossTotal = useMemo(() => {
    if (!lineItems || !Array.isArray(lineItems)) return 0;
    return lineItems.reduce((sum, item) => {
      const qty = Number(item?.soldQuantity) || 0;
      const rate = Number(item?.rate) || 0;
      return sum + qty * rate;
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
      navigate('/purchases');
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Failed to create purchase order';
      message.error(msg);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: '120px' }}>
      {/* Top Header Navigation */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/purchases')}
        />
        <Space>
          <ShoppingOutlined style={{ color: '#10b981', fontSize: '20px' }} />
          <Title level={4} style={{ margin: 0 }}>New Purchase Order</Title>
        </Space>
      </div>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header Metadata Section */}
        <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                label={<Text strong>Supplier</Text>}
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
                      size="large"
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
                label={<Text strong>Invoice No</Text>}
                validateStatus={errors.invoiceNo ? 'error' : ''}
                help={errors.invoiceNo?.message}
                required
              >
                <Controller
                  name="invoiceNo"
                  control={control}
                  render={({ field }) => <Input size="large" {...field} placeholder="INV-2026-001" style={{ width: '100%' }} />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={<Text strong>Invoice Date</Text>}
                validateStatus={errors.invoiceDate ? 'error' : ''}
                help={errors.invoiceDate?.message}
                required
              >
                <Controller
                  name="invoiceDate"
                  control={control}
                  render={({ field }) => <Input type="date" size="large" {...field} style={{ width: '100%' }} />}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item label={<Text strong>Payment Method</Text>}>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      size="large"
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
            <Col xs={24} md={16}>
              <Form.Item label={<Text strong>Notes (Optional)</Text>}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => <Input size="large" {...field} placeholder="Add any relevant purchasing notes here..." style={{ width: '100%' }} />}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Data Grid Section */}
        <Card 
          bordered={false} 
          style={{ borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={5} style={{ margin: 0 }}>Line Items</Title>
              <Text type="secondary">Add items from the supplier's catalog</Text>
            </div>
            {catalogStatus === 'loading' && <Text style={{ color: '#10b981' }}>Syncing catalog...</Text>}
          </div>

          <div style={{ overflowX: 'auto' }}>
            {catalogStatus === 'idle' ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <ShoppingOutlined style={{ fontSize: '36px', color: '#d9d9d9', marginBottom: '12px' }} />
                <br/>
                <Text strong style={{ fontSize: '16px', color: '#8c8c8c' }}>Select a supplier to begin.</Text>
                <br/>
                <Text type="secondary">The product catalog will load automatically.</Text>
              </div>
            ) : catalogStatus === 'loading' ? (
              <div style={{ padding: '24px' }}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Skeleton.Input active block size="large" />
                  <Skeleton.Input active block size="large" />
                  <Skeleton.Input active block size="large" />
                </Space>
              </div>
            ) : catalogStatus === 'error' ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#f5222d' }}>
                Failed to load the catalog. Please refresh or select the supplier again.
              </div>
            ) : (
              <PurchaseLineItemGrid 
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
          backgroundColor: '#fff', 
          borderTop: '1px solid #f0f0f0', 
          boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)', 
          zIndex: 20 
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Financial Adjustments */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', marginBottom: '4px' }}>Gross</span>
                <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 600 }}>{grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div style={{ height: '32px', width: '1px', backgroundColor: '#f0f0f0' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', marginBottom: '4px' }}>Discount (-)</span>
                <Controller
                  name="discountAmount"
                  control={control}
                  render={({ field }) => (
                    <InputNumber {...field} min={0} step={0.01} precision={2} variant="borderless" style={{ padding: 0, backgroundColor: 'transparent', fontFamily: 'monospace', fontSize: '16px', fontWeight: 500, width: '100px', color: '#f5222d' }} placeholder="0.00" />
                  )}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', marginBottom: '4px' }}>Returns (-)</span>
                <Controller
                  name="returnsDeductedAmount"
                  control={control}
                  render={({ field }) => (
                    <InputNumber {...field} min={0} step={0.01} precision={2} variant="borderless" style={{ padding: 0, backgroundColor: 'transparent', fontFamily: 'monospace', fontSize: '16px', fontWeight: 500, width: '100px', color: '#f5222d' }} placeholder="0.00" />
                  )}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', marginBottom: '4px' }}>VAT (+)</span>
                <Controller
                  name="vatAmount"
                  control={control}
                  render={({ field }) => (
                    <InputNumber {...field} min={0} step={0.01} precision={2} variant="borderless" style={{ padding: 0, backgroundColor: 'transparent', fontFamily: 'monospace', fontSize: '16px', fontWeight: 500, width: '100px', color: '#10b981' }} placeholder="0.00" />
                  )}
                />
              </div>
            </div>

            {/* Net Total & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', marginBottom: '4px' }}>Net Total</span>
                <span style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>LKR {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <Button size="large" onClick={() => navigate('/purchases')} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button size="large" type="primary" htmlType="submit" loading={isSubmitting} style={{ backgroundColor: '#10b981', boxShadow: '0 4px 6px -1px rgba(16,185,129,0.2)' }}>
                Submit Order
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
