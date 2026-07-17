import { useState } from 'react';
import { 
  Button, Card, Typography, message, Result, List as AntList, 
  Drawer, Form, InputNumber, Input, Tag, Spin, Table, Row, Col, DatePicker, Space
} from 'antd';
import { CheckCircleOutlined, ShopOutlined, CloseCircleOutlined, InfoCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { QrCameraScanner } from '../components/common';
import { qrApi, deliveryApi } from '../api/sales';

const { Title, Text } = Typography;

interface ShopQrResponse {
  shopId: number;
  shopName: string;
  tenantId: number;
  qrPayload: string;
}

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  rate: number;
  unitType: string;
}

interface LoadingSheet {
  deliveryId: number;
  loadingSheetId: number;
  sheetNumber: string;
  driverName: string;
  status: string;
  items: OrderItem[];
}

export function QrScanPage() {
  const [shop, setShop] = useState<ShopQrResponse | null>(null);
  const [loadingSheets, setLoadingSheets] = useState<LoadingSheet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<LoadingSheet | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [completedSheets, setCompletedSheets] = useState<Record<number, boolean>>({});

  const cashVal = Form.useWatch('cashAmount', form) || 0;
  const chequeVal = Form.useWatch('chequeAmount', form) || 0;
  const loanVal = Form.useWatch('loanAmount', form) || 0;

  const calculateNetBill = () => {
    const items = form.getFieldValue('items') || [];
    return items.reduce((sum: number, i: Record<string, unknown>) => {
      const q = Number(i?.quantityDelivered || 0);
      const r = Number(i?.rate || 0);
      const d = Number(i?.discountAmount || 0);
      return sum + (q * r - d);
    }, 0);
  };

  const handleScanSuccess = async (decodedText: string) => {
    setIsLoading(true);
    try {
      const shopData = await qrApi.resolveToken(decodedText);
      setShop(shopData);
      
      const sheets = await qrApi.getTodaySheets(shopData.shopId);
      setLoadingSheets(sheets);
      
      if (sheets.length === 0) {
        message.info(`No active deliveries found for ${shopData.shopName} today`);
      } else {
        message.success(`Found ${sheets.length} deliveries for ${shopData.shopName}`);
        if (sheets.length === 1) {
          openUnloadForm(sheets[0]);
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; message?: string } } };
      message.error(e?.response?.data?.detail || e?.response?.data?.message || 'Failed to verify QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const openUnloadForm = (sheet: LoadingSheet) => {
    setSelectedSheet(sheet);
    form.setFieldsValue({
      items: sheet.items.map(i => ({
        productId: i.productId,
        quantityDelivered: i.quantity,
        unitType: i.unitType,
        rate: i.rate,
        discountAmount: 0,
      })),
      cashAmount: 0,
      chequeAmount: 0,
    });
    setDrawerOpen(true);
  };

  const handleCancelOrder = async (sheet: LoadingSheet) => {
    if (!shop) return;
    try {
      setIsLoading(true);
      await deliveryApi.recordShop(String(sheet.deliveryId), String(shop.shopId), {
        items: [],
        returns: [],
        payments: [],
        notes: 'Order cancelled by driver'
      });
      message.success('Order cancelled successfully');
      setCompletedSheets(prev => ({ ...prev, [sheet.deliveryId]: true }));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; message?: string } } };
      message.error(e?.response?.data?.detail || e?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordDelivery = async () => {
    if (!shop || !selectedSheet) return;
    
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const items = (values.items || []).map((item: { productId: string | number; quantityDelivered: string | number; unitType: string; rate: string | number; discountAmount: string | number; }) => ({
        productId: Number(item.productId),
        quantityDelivered: Number(item.quantityDelivered || 0),
        unitType: item.unitType || 'EACH',
        rate: Number(item.rate || 0),
        discountAmount: Number(item.discountAmount || 0),
        isFreeItem: false,
      }));

      const payments = [];
      if (values.cashAmount && Number(values.cashAmount) > 0) {
        payments.push({ paymentMethod: 'CASH', amount: Number(values.cashAmount) });
      }
      if (values.chequeAmount && Number(values.chequeAmount) > 0) {
        payments.push({
          paymentMethod: 'CHEQUE',
          amount: Number(values.chequeAmount),
          chequeNo: values.chequeNo || '',
          chequeBankName: values.chequeBankName || '',
        });
      }

      await deliveryApi.recordShop(String(selectedSheet.deliveryId), String(shop.shopId), {
        items,
        returns: [],
        payments,
      });

      message.success(`Delivery recorded for ${shop.shopName}`);
      setDrawerOpen(false);
      setCompletedSheets(prev => ({ ...prev, [selectedSheet.deliveryId]: true }));
    } catch (err: unknown) {
      const e = err as { errorFields?: unknown; response?: { data?: { detail?: string; message?: string } } };
      if (e.errorFields) return;
      message.error(e?.response?.data?.detail || e?.response?.data?.message || 'Failed to record delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const resetScanner = () => {
    setShop(null);
    setLoadingSheets([]);
    setCompletedSheets({});
  };

  if (isLoading && !shop) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Spin size="large" tip="Loading shop data..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full pb-20">
      {!shop ? (
        <Card className="shadow-lg border-0 bg-slate-900 rounded-2xl overflow-hidden">
          <div className="text-center mb-8">
            <ShopOutlined className="text-5xl text-emerald-500 mb-4" />
            <Title level={3} className="!text-white !mb-2">Scan Shop QR</Title>
            <Text className="text-slate-400">Position the shop's QR code in the frame below</Text>
          </div>
          
          <QrCameraScanner 
            onScanSuccess={handleScanSuccess} 
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-emerald-900/20 border-emerald-500/30">
            <Result
              status="success"
              title={<span className="text-emerald-400">Shop Identified</span>}
              subTitle={<span className="text-emerald-200 text-lg">{shop.shopName}</span>}
              icon={<CheckCircleOutlined className="text-emerald-500" />}
            />
          </Card>

          <Title level={4} className="!mb-4">Today's Deliveries</Title>
          
          {loadingSheets.length === 0 ? (
            <Card className="text-center py-8">
              <InfoCircleOutlined className="text-4xl text-slate-400 mb-4" />
              <p className="text-slate-500">No active deliveries scheduled for this shop today.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {loadingSheets.map((sheet) => {
                const isCompleted = completedSheets[sheet.deliveryId];
                return (
                  <Card 
                    key={sheet.deliveryId} 
                    className={`shadow-sm transition-all ${isCompleted ? 'opacity-60 grayscale' : 'border-emerald-500/30'}`}
                    title={
                      <div className="flex justify-between items-center">
                        <span>Sheet: {sheet.sheetNumber}</span>
                        {isCompleted && <Tag color="success">Completed</Tag>}
                      </div>
                    }
                  >
                    <AntList
                      size="small"
                      dataSource={sheet.items}
                      renderItem={(item) => (
                        <AntList.Item className="!px-0">
                          <AntList.Item.Meta
                            title={item.productName}
                            description={
                              <div className="flex gap-2 mt-1">
                                <Tag color="blue">{item.quantity} {item.unitType}</Tag>
                                <Tag color="default">Rate: {item.rate.toFixed(2)}</Tag>
                              </div>
                            }
                          />
                        </AntList.Item>
                      )}
                    />
                    
                    {!isCompleted && (
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button 
                          danger 
                          icon={<CloseCircleOutlined />} 
                          onClick={() => handleCancelOrder(sheet)}
                          loading={isLoading}
                        >
                          Cancel Order
                        </Button>
                        <Button 
                          type="primary" 
                          icon={<DollarOutlined />}
                          onClick={() => openUnloadForm(sheet)}
                          className="bg-emerald-600 hover:bg-emerald-500"
                        >
                          Unload & Pay
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          <Button block size="large" onClick={resetScanner} className="mt-8">
            Scan Another Shop
          </Button>
        </div>
      )}

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 600, fontSize: '18px' }}>
            <span>Unload to Shop & Payment Collection — Sheet #{selectedSheet?.sheetNumber}</span>
          </div>
        }
        placement="bottom"
        height="100vh"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" component={false}>
          <div className="py-2 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <Title level={5} className="m-0 text-slate-800">
                  <ShopOutlined className="mr-2 text-emerald-600" />
                  Unloading at: <Text strong>{shop?.shopName}</Text>
                </Title>
              </div>
            </div>

            <div className="space-y-4">
              <div style={{
                fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)',
                marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border-default)'
              }}>
                1. Delivered Items
              </div>
            <Form.List name="items">
              {(fields) => (
                <Table
                  dataSource={fields}
                  pagination={false}
                  size="small"
                  className="mb-6 overflow-x-auto"
                  columns={[
                    {
                      title: 'Product',
                      key: 'productName',
                      render: (_, field) => {
                        const item = selectedSheet?.items[field.name];
                        return (
                          <>
                            <Form.Item name={[field.name, 'productId']} hidden noStyle><Input /></Form.Item>
                            <Form.Item name={[field.name, 'unitType']} hidden noStyle><Input /></Form.Item>
                            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                              {item?.productName}
                            </span>
                          </>
                        );
                      },
                    },
                    {
                      title: 'Quantity',
                      key: 'quantityDelivered',
                      width: 140,
                      render: (_, field) => (
                        <Form.Item name={[field.name, 'quantityDelivered']} noStyle rules={[{ required: true, message: 'Required' }]}>
                          <InputNumber min={0} className="w-full" />
                        </Form.Item>
                      ),
                    },
                    {
                      title: 'Rate (Rs)',
                      key: 'rate',
                      width: 130,
                      render: (_, field) => (
                        <Form.Item name={[field.name, 'rate']} noStyle>
                          <InputNumber min={0} className="w-full" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }} />
                        </Form.Item>
                      ),
                    },
                    {
                      title: 'Discount (Rs)',
                      key: 'discountAmount',
                      width: 130,
                      render: (_, field) => (
                        <Form.Item name={[field.name, 'discountAmount']} noStyle>
                          <InputNumber min={0} className="w-full" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }} />
                        </Form.Item>
                      ),
                    },
                    {
                      title: 'Total (Rs)',
                      key: 'lineTotal',
                      width: 140,
                      align: 'right' as const,
                      render: (_, field) => {
                        const items = form.getFieldValue('items');
                        const item = items?.[field.name] || {};
                        const q = Number(item.quantityDelivered || 0);
                        const r = Number(item.rate || 0);
                        const d = Number(item.discountAmount || 0);
                        const total = (q * r) - d;
                        return (
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                            {total.toLocaleString()}
                          </span>
                        );
                      },
                    },
                  ]}
                />
              )}
            </Form.List>

            <div style={{
              fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)',
              marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border-default)'
            }}>
              2. Payment Collection Breakdown (Cash / Cheque / Loan)
            </div>
            <Card styles={{ body: { padding: '20px' } }} style={{ border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item name="cashAmount" label="Cash Amount (Rs)" className="!mb-0">
                    <InputNumber min={0} className="w-full" size="large" style={{ fontVariantNumeric: 'tabular-nums' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="chequeAmount" label="Cheque Amount (Rs)" className="!mb-0">
                    <InputNumber min={0} className="w-full" size="large" style={{ fontVariantNumeric: 'tabular-nums' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="loanAmount" label="Loan / Credit (Rs)" className="!mb-0">
                    <InputNumber min={0} className="w-full" size="large" placeholder="Auto / Explicit credit" style={{ fontVariantNumeric: 'tabular-nums' }} />
                  </Form.Item>
                </Col>
              </Row>

              {Number(chequeVal) > 0 && (
                <div style={{
                  background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)', padding: '16px', marginTop: '16px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                    Cheque Details
                  </div>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Form.Item name="chequeNo" label="Cheque No" rules={[{ required: true, message: 'Required' }]} className="!mb-0">
                        <Input placeholder="e.g. CHQ-982341" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="chequeBankName" label="Bank Name" rules={[{ required: true, message: 'Required' }]} className="!mb-0">
                        <Input placeholder="e.g. BOC / Commercial Bank" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="chequeDate" label="Cheque Date" rules={[{ required: true, message: 'Required' }]} className="!mb-0">
                        <DatePicker className="w-full" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              )}
            </Card>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)', padding: '16px', marginTop: '24px', flexWrap: 'wrap', gap: '16px'
            }}>
              <div aria-live="polite" role="status" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', marginRight: '8px' }}>Total Net Bill:</span>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Rs. {calculateNetBill().toLocaleString()}
                  </span>
                </div>
                
                <div style={{ width: '1px', height: '24px', background: 'var(--color-border-default)' }} className="hidden sm:block" />
                
                {(() => {
                  const netBill = calculateNetBill();
                  const entered = Number(cashVal || 0) + Number(chequeVal || 0) + Number(loanVal || 0);
                  const diff = netBill - entered;
                  
                  let statusColor;
                  if (diff > 0) statusColor = 'var(--color-danger-text)';
                  else if (diff < 0) statusColor = 'var(--color-warning-text)';
                  else statusColor = 'var(--color-success-text)';
                  
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div>
                        <span style={{ color: 'var(--color-text-secondary)', marginRight: '8px' }}>Total Entered:</span>
                        <span style={{ fontSize: '18px', fontWeight: 600, color: statusColor }}>
                          Rs. {entered.toLocaleString()}
                        </span>
                      </div>
                      {diff !== 0 && (
                        <span style={{ 
                          fontSize: '13px', fontWeight: 600, color: statusColor,
                          background: diff > 0 ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
                          padding: '4px 8px', borderRadius: '4px'
                        }}>
                          {diff > 0 ? `Short by Rs. ${diff.toLocaleString()}` : `Over by Rs. ${Math.abs(diff).toLocaleString()}`}
                        </span>
                      )}
                      {diff === 0 && netBill > 0 && (
                        <CheckCircleOutlined style={{ color: 'var(--color-success-text)', fontSize: '18px' }} />
                      )}
                    </div>
                  );
                })()}
              </div>
              <Space size={12} className="w-full sm:w-auto justify-end">
                <Button onClick={() => setDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleRecordDelivery}
                  loading={submitting}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  Save Shop Delivery
                </Button>
              </Space>
            </div>
            </div>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}
