/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Typography,
  message,
  Space,
  Breadcrumb,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../api/client';
import { repOrderApi } from '../api/sales';

const { Title, Text } = Typography;

// Schema definition
const repOrderItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(0),
  unitType: z.string().min(1, 'Unit type is required'),
  rate: z.number().min(0),
  isFreeItem: z.boolean().default(false),
  boxesNeeded: z.number().min(0),
});

const shopReturnSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1),
  unitType: z.string().min(1, 'Unit type is required'),
  creditValue: z.number().min(0),
  returnType: z.string().min(1, 'Return type is required'),
});

const repOrderShopSchema = z.object({
  shopId: z.string().min(1, 'Shop is required'),
  discountAmount: z.number().min(0).optional(),
  skuDiscountAmount: z.number().min(0).optional(),
  returnWarehouseId: z.string().optional(),
  items: z.array(repOrderItemSchema).min(1, 'At least one item is required'),
  returns: z.array(shopReturnSchema).optional(),
});

const repOrderSchema = z.object({
  repId: z.string().min(1, 'Rep is required'),
  orderNumber: z.string().min(1, 'Order number is required'),
  orderDate: z.string().min(1, 'Order date is required'),
  routeArea: z.string().optional(),
  supplierId: z.string().optional(),
  shops: z.array(repOrderShopSchema).min(1, 'At least one shop is required'),
});

type FormValues = z.infer<typeof repOrderSchema>;

const emptyItem = {
  productId: '',
  quantity: 1,
  unitType: 'EACH',
  rate: 0,
  isFreeItem: false,
  boxesNeeded: 0,
};

const emptyReturn = {
  productId: '',
  quantity: 1,
  unitType: 'EACH',
  creditValue: 0,
  returnType: 'DAMAGE',
};

const emptyShop = {
  shopId: '',
  discountAmount: 0,
  skuDiscountAmount: 0,
  returnWarehouseId: '',
  items: [emptyItem],
  returns: [],
};

export function CreateRepOrderPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  // Data for dropdowns
  const [reps, setReps] = useState<{ id: string; name: string }[]>([]);
  const [shopsList, setShopsList] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string; storeType: string }[]>([]);

  useEffect(() => {
    // Fetch dropdown data (Reps, Shops, Products, Suppliers, Warehouses)
    apiClient.get('/api/v1/sales/master-data/reps').then(res => setReps(res.data?.content || []));
    apiClient.get('/api/v1/sales/master-data/shops').then(res => setShopsList(res.data?.content || []));
    apiClient.get('/api/v1/products?size=500').then(res => setProducts(res.data?.content || []));
    apiClient.get('/api/v1/suppliers?size=500').then(res => setSuppliers(res.data?.content || []));
    apiClient.get('/api/v1/inventory/warehouses?size=500').then(res => setWarehouses(res.data?.content || []));
  }, []);

  const { control, handleSubmit, setValue } = useForm<FormValues>({
    resolver: zodResolver(repOrderSchema) as any,
    defaultValues: {
      repId: '',
      orderNumber: '',
      orderDate: dayjs().format('YYYY-MM-DD'),
      routeArea: '',
      supplierId: '',
      shops: [emptyShop],
    },
  });

  const selectedSupplierId = useWatch({ control, name: 'supplierId' });
  const filteredProducts = selectedSupplierId 
    ? products.filter(p => p.supplierId?.toString() === selectedSupplierId || p.supplier?.id?.toString() === selectedSupplierId) 
    : products;

  const { fields: shopFields, append: appendShop, remove: removeShop } = useFieldArray({
    control,
    name: 'shops',
  });

  const shopsData = useWatch({ control, name: 'shops' }) || [];
  const grandTotal = shopsData.reduce((sum, shop) => {
    const items = shop.items || [];
    const returns = shop.returns || [];
    
    const itemsTotal = items.reduce((s: number, item: any) => s + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);
    const returnsTotal = returns.reduce((s: number, r: any) => s + Number(r.creditValue || 0), 0);
    
    const shopNet = itemsTotal - returnsTotal - Number(shop.discountAmount || 0) - Number(shop.skuDiscountAmount || 0);
    return sum + shopNet;
  }, 0);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        repId: Number(values.repId),
        orderNumber: values.orderNumber,
        orderDate: values.orderDate,
        routeArea: values.routeArea,
        shops: values.shops.map(shop => ({
          shopId: Number(shop.shopId),
          discountAmount: shop.discountAmount || 0,
          skuDiscountAmount: shop.skuDiscountAmount || 0,
          returnWarehouseId: shop.returnWarehouseId ? Number(shop.returnWarehouseId) : undefined,
          items: shop.items.map(item => ({
            productId: Number(item.productId),
            quantity: item.quantity,
            unitType: item.unitType,
            rate: item.rate,
            isFreeItem: item.isFreeItem,
            boxesNeeded: item.boxesNeeded,
          })),
          returns: shop.returns ? shop.returns.map(r => ({
            productId: Number(r.productId),
            quantity: r.quantity,
            unitType: r.unitType,
            creditValue: r.creditValue,
            returnType: r.returnType,
          })) : [],
        })),
      };

      await repOrderApi.create(payload);
      message.success('Rep Order created successfully');
      navigate('/sales');
    } catch (error) {
      console.error(error);
      message.error('Failed to create Rep Order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: '120px' }}>
      {/* Top Header Navigation */}
      <div style={{ padding: '24px 24px 0 24px', maxWidth: 1200, margin: '0 auto' }}>
        <Breadcrumb items={[{ title: 'Rep Orders', href: '/sales' }, { title: 'New Rep Order' }]} />
        <Title level={2} style={{ marginTop: '8px', marginBottom: 0 }}>New Rep Order</Title>
      </div>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit as any)} style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header Metadata Section */}
        <Card variant="borderless" style={{ borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}>
          <Row gutter={24}>
            <Col xs={24} md={6}>
              <Form.Item label={<Text strong>Order Number</Text>} required>
                <Controller
                  name="orderNumber"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Input size="large" {...field} placeholder="e.g. RO-1001" status={fieldState.error ? 'error' : undefined} />
                      {fieldState.error && <Text type="danger" style={{ fontSize: '12px' }}>{fieldState.error.message}</Text>}
                    </>
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item label={<Text strong>Sales Rep</Text>} required>
                <Controller
                  name="repId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Select
                        size="large"
                        {...field}
                        options={reps.map((r) => ({ label: r.name, value: r.id.toString() }))}
                        placeholder="Select Sales Rep"
                        status={fieldState.error ? 'error' : undefined}
                      />
                      {fieldState.error && <Text type="danger" style={{ fontSize: '12px' }}>{fieldState.error.message}</Text>}
                    </>
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item label={<Text strong>Supplier (Filter)</Text>}>
                <Controller
                  name="supplierId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      size="large"
                      {...field}
                      allowClear
                      options={suppliers.map((s) => ({ label: s.name, value: s.id.toString() }))}
                      placeholder="Filter items by Supplier"
                    />
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item label={<Text strong>Order Date</Text>} required>
                <Controller
                  name="orderDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      size="large"
                      style={{ width: '100%' }}
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                    />
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={6}>
              <Form.Item label={<Text strong>Route Area</Text>}>
                <Controller
                  name="routeArea"
                  control={control}
                  render={({ field }) => <Input size="large" {...field} placeholder="e.g. Kahawaththa" />}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Shops Loop */}
        {shopFields.map((shopField, shopIndex) => (
          <ShopSection
            key={shopField.id}
            shopIndex={shopIndex}
            control={control}
            removeShop={() => removeShop(shopIndex)}
            setValue={setValue}
            shopsList={shopsList}
            products={filteredProducts}
            warehouses={warehouses}
            showRemove={shopFields.length > 1}
          />
        ))}

        <Button
          type="dashed"
          block
          size="large"
          icon={<PlusOutlined />}
          onClick={() => appendShop(emptyShop)}
          style={{ height: '48px', color: '#10b981', borderColor: '#10b981' }}
        >
          Add Another Shop to Route
        </Button>

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
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', marginBottom: '4px' }}>Net Total (All Shops)</span>
              <span style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>LKR {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            
            <Button size="large" onClick={() => navigate('/sales')} disabled={submitting}>
              Cancel
            </Button>
            <Button size="large" type="primary" htmlType="submit" loading={submitting} style={{ backgroundColor: '#10b981', boxShadow: '0 4px 6px -1px rgba(16,185,129,0.2)' }}>
              Create Rep Order
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}

// Sub-component to isolate nested field array logic
function ShopSection({ shopIndex, control, removeShop, setValue, shopsList, products, warehouses, showRemove }: any) {
  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: `shops.${shopIndex}.items`,
  });

  const { fields: returnFields, append: appendReturn, remove: removeReturn } = useFieldArray({
    control,
    name: `shops.${shopIndex}.returns`,
  });

  const shopItems = useWatch({ control, name: `shops.${shopIndex}.items` }) || [];
  const shopReturns = useWatch({ control, name: `shops.${shopIndex}.returns` }) || [];
  const discountAmount = useWatch({ control, name: `shops.${shopIndex}.discountAmount` }) || 0;
  const skuDiscountAmount = useWatch({ control, name: `shops.${shopIndex}.skuDiscountAmount` }) || 0;

  const itemsTotal = shopItems.reduce((sum: number, item: any) => sum + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);
  const returnsTotal = shopReturns.reduce((sum: number, item: any) => sum + Number(item.creditValue || 0), 0);
  const shopNetTotal = itemsTotal - returnsTotal - Number(discountAmount) - Number(skuDiscountAmount);

  return (
    <Card 
      variant="borderless"
      style={{ borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Title level={5} style={{ margin: 0 }}>Shop #{shopIndex + 1}</Title>
        </Space>
        {showRemove && (
          <Button danger type="text" icon={<DeleteOutlined />} onClick={removeShop}>
            Remove Shop
          </Button>
        )}
      </div>

      <div style={{ padding: '24px', borderBottom: '1px solid #f0f0f0' }}>
        <Row gutter={24}>
          <Col xs={24} md={6}>
            <Form.Item label={<Text strong>Select Shop</Text>} required style={{ margin: 0 }}>
              <Controller
                name={`shops.${shopIndex}.shopId`}
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Select
                      size="large"
                      {...field}
                      showSearch
                      optionFilterProp="label"
                      options={shopsList.map((s: any) => ({ label: s.name, value: s.id.toString() }))}
                      placeholder="Search and select shop"
                      status={fieldState.error ? 'error' : undefined}
                    />
                    {fieldState.error && <Text type="danger" style={{ fontSize: '12px' }}>{fieldState.error.message}</Text>}
                  </>
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label={<Text strong>Discount Amount (LKR)</Text>} style={{ margin: 0 }}>
              <Controller
                name={`shops.${shopIndex}.discountAmount`}
                control={control}
                render={({ field }) => (
                  <InputNumber size="large" onFocus={(e) => e.target.select()} {...field} min={0} step={0.01} precision={2} style={{ width: '100%', fontWeight: 600, fontSize: '16px' }} className="text-right" />
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label={<Text strong>SKU Discount Amount (LKR)</Text>} style={{ margin: 0 }}>
              <Controller
                name={`shops.${shopIndex}.skuDiscountAmount`}
                control={control}
                render={({ field }) => (
                  <InputNumber size="large" onFocus={(e) => e.target.select()} {...field} min={0} step={0.01} precision={2} style={{ width: '100%', fontWeight: 600, fontSize: '16px' }} className="text-right" />
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label={<Text strong>Returns Warehouse</Text>} style={{ margin: 0 }}>
              <Controller
                name={`shops.${shopIndex}.returnWarehouseId`}
                control={control}
                render={({ field }) => (
                  <Select
                    size="large"
                    {...field}
                    allowClear
                    options={warehouses.map((w: any) => ({ label: w.name, value: w.id.toString() }))}
                    placeholder="Select warehouse for returns"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Items Table */}
      <div style={{ padding: '16px 24px 8px 24px' }}>
        <Text strong style={{ fontSize: '16px' }}>Order Items</Text>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
            <tr>
              <th style={{ padding: '12px 24px', color: '#8c8c8c', fontWeight: 600 }}>Product</th>
              <th style={{ padding: '12px', color: '#8c8c8c', fontWeight: 600, width: '120px', textAlign: 'right' }}>Qty</th>
              <th style={{ padding: '12px', color: '#8c8c8c', fontWeight: 600, width: '150px', textAlign: 'right' }}>Rate (LKR)</th>
              <th style={{ padding: '12px 24px', color: '#8c8c8c', fontWeight: 600, textAlign: 'right' }}>Amount (LKR)</th>
              <th style={{ padding: '12px', width: '48px' }}></th>
            </tr>
          </thead>
          <tbody>
            {itemFields.map((itemField, itemIndex) => {
              const currentItem = shopItems[itemIndex] || {};
              const amount = (Number(currentItem.quantity || 0) * Number(currentItem.rate || 0));
              
              return (
                <tr key={itemField.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 24px' }}>
                    <Controller
                      name={`shops.${shopIndex}.items.${itemIndex}.productId`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          showSearch
                          optionFilterProp="label"
                          style={{ width: '100%' }}
                          options={products.map((p: any) => ({ label: `${p.sku} - ${p.name}`, value: p.id.toString() }))}
                          onChange={(val) => {
                            field.onChange(val);
                            const prod = products.find((p: any) => p.id.toString() === val);
                            if (prod) {
                              setValue(`shops.${shopIndex}.items.${itemIndex}.rate`, prod.basePrice);
                            }
                          }}
                        />
                      )}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Controller
                      name={`shops.${shopIndex}.items.${itemIndex}.quantity`}
                      control={control}
                      render={({ field }) => <InputNumber size="large" onFocus={(e) => e.target.select()} {...field} min={1} style={{ width: '100%', fontWeight: 600, fontSize: '16px' }} className="text-right" />}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Controller
                      name={`shops.${shopIndex}.items.${itemIndex}.rate`}
                      control={control}
                      render={({ field }) => <InputNumber size="large" onFocus={(e) => e.target.select()} {...field} min={0} step={0.01} precision={2} style={{ width: '100%', fontWeight: 600, fontSize: '16px' }} className="text-right" />}
                    />
                  </td>
                  <td style={{ padding: '12px 24px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: '#111827' }}>
                    {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => itemFields.length > 1 && removeItem(itemIndex)}
                      disabled={itemFields.length <= 1}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '16px 24px', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
        <Button type="dashed" icon={<PlusOutlined />} onClick={() => appendItem(emptyItem)}>
          Add Item
        </Button>
      </div>

      {/* Returns Table */}
      <div style={{ padding: '16px 24px 8px 24px' }}>
        <Text strong style={{ fontSize: '16px', color: '#111827' }}>Returns</Text>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
            <tr>
              <th style={{ padding: '12px 24px', color: '#8c8c8c', fontWeight: 600 }}>Product</th>
              <th style={{ padding: '12px', color: '#8c8c8c', fontWeight: 600, width: '120px', textAlign: 'right' }}>Qty</th>
              <th style={{ padding: '12px', color: '#8c8c8c', fontWeight: 600, width: '150px' }}>Return Type</th>
              <th style={{ padding: '12px 24px', color: '#8c8c8c', fontWeight: 600, textAlign: 'right', width: '200px' }}>Credit Value (LKR)</th>
              <th style={{ padding: '12px', width: '48px' }}></th>
            </tr>
          </thead>
          <tbody>
            {returnFields.map((returnField, returnIndex) => {
              return (
                <tr key={returnField.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 24px' }}>
                    <Controller
                      name={`shops.${shopIndex}.returns.${returnIndex}.productId`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          showSearch
                          optionFilterProp="label"
                          style={{ width: '100%' }}
                          options={products.map((p: any) => ({ label: `${p.sku} - ${p.name}`, value: p.id.toString() }))}
                        />
                      )}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Controller
                      name={`shops.${shopIndex}.returns.${returnIndex}.quantity`}
                      control={control}
                      render={({ field }) => <InputNumber size="large" onFocus={(e) => e.target.select()} {...field} min={1} style={{ width: '100%', fontWeight: 600, fontSize: '16px' }} className="text-right" />}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Controller
                      name={`shops.${shopIndex}.returns.${returnIndex}.returnType`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          size="large"
                          style={{ width: '100%' }}
                          options={[
                            { label: 'Damage', value: 'DAMAGE' },
                            { label: 'Expiry', value: 'EXPIRY' },
                            { label: 'Sales Return', value: 'SALES_RETURN' },
                          ]}
                        />
                      )}
                    />
                  </td>
                  <td style={{ padding: '12px 24px' }}>
                    <Controller
                      name={`shops.${shopIndex}.returns.${returnIndex}.creditValue`}
                      control={control}
                      render={({ field }) => <InputNumber size="large" onFocus={(e) => e.target.select()} {...field} min={0} step={0.01} precision={2} style={{ width: '100%', fontWeight: 600, fontSize: '16px' }} className="text-right" />}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeReturn(returnIndex)} />
                  </td>
                </tr>
              );
            })}
            {returnFields.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#bfbfbf' }}>No returns for this shop</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '16px 24px', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
        <Button type="dashed" style={{ color: '#4b5563', borderColor: '#d1d5db' }} icon={<PlusOutlined />} onClick={() => appendReturn(emptyReturn)}>
          Add Return
        </Button>
      </div>

      <div style={{ padding: '24px', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <div style={{ textAlign: 'right' }}>
          <Text style={{ color: '#8c8c8c', marginRight: '16px' }}>Shop Subtotal:</Text>
          <Text style={{ fontSize: '18px', fontFamily: 'monospace', color: '#111827', fontWeight: 'bold' }}>
            LKR {shopNetTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
        </div>
      </div>
    </Card>
  );
}


