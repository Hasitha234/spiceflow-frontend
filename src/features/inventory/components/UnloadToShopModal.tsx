import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Table, Button, Form, InputNumber, Input, DatePicker, Typography, Card, Space, App, Spin, Row, Col } from 'antd';
import { CheckCircleOutlined, DollarOutlined, ShopOutlined, CarOutlined } from '@ant-design/icons';
import { deliveryApi, repOrderApi } from '../../../api/sales';
import type { LoadingSheet, RepOrder, Delivery, RepOrderShop } from '../../../types/sales';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

type ShopRowData = RepOrderShop | Record<string, unknown>;

interface FormItemData {
  productId?: number;
  quantityDelivered?: number;
  unitType?: string;
  rate?: number;
  discountAmount?: number;
  isFreeItem?: boolean;
}

interface UnloadToShopModalProps {
  visible: boolean;
  loadingSheet: LoadingSheet | null;
  onClose: () => void;
}

export const UnloadToShopModal: React.FC<UnloadToShopModalProps> = ({
  visible,
  loadingSheet,
  onClose,
}) => {
  const { message } = App.useApp();
  const [repOrder, setRepOrder] = useState<RepOrder | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(false);
  const [recordingShopId, setRecordingShopId] = useState<string | null>(null);
  const [activeShop, setActiveShop] = useState<ShopRowData | null>(null);
  const [submittingShop, setSubmittingShop] = useState(false);

  const [form] = Form.useForm();

  const getShopId = (row?: unknown): string => {
    if (!row || typeof row !== 'object') return '';
    const r = row as Record<string, unknown>;
    if (r.shop && typeof r.shop === 'object') {
      const s = r.shop as Record<string, unknown>;
      if (s.id) return String(s.id);
    }
    if (r.shopId) return String(r.shopId);
    if (r.id) return String(r.id);
    return '';
  };

  const getShopName = (row?: unknown): string => {
    if (!row || typeof row !== 'object') return 'Unknown Shop';
    const r = row as Record<string, unknown>;
    if (r.shop && typeof r.shop === 'object') {
      const s = r.shop as Record<string, unknown>;
      if (s.name) return String(s.name);
    }
    if (r.shopName) return String(r.shopName);
    return 'Unknown Shop';
  };

  const getOwnerName = (row?: unknown): string => {
    if (!row || typeof row !== 'object') return '';
    const r = row as Record<string, unknown>;
    if (r.shop && typeof r.shop === 'object') {
      const s = r.shop as Record<string, unknown>;
      if (s.ownerName) return String(s.ownerName);
    }
    if (r.ownerName) return String(r.ownerName);
    return '';
  };

  const getPhone = (row?: unknown): string => {
    if (!row || typeof row !== 'object') return 'N/A';
    const r = row as Record<string, unknown>;
    if (r.shop && typeof r.shop === 'object') {
      const s = r.shop as Record<string, unknown>;
      if (s.phone) return String(s.phone);
    }
    return 'N/A';
  };

  const getOutstandingLoan = (row?: unknown): number => {
    if (!row || typeof row !== 'object') return 0;
    const r = row as Record<string, unknown>;
    if (r.shop && typeof r.shop === 'object') {
      const s = r.shop as Record<string, unknown>;
      if (s.outstandingLoan !== undefined) return Number(s.outstandingLoan);
    }
    if (r.outstandingLoan !== undefined) return Number(r.outstandingLoan);
    return 0;
  };

  // Watch form values for real-time payment calculations
  const cashVal = Form.useWatch('cashAmount', form) || 0;
  const chequeVal = Form.useWatch('chequeAmount', form) || 0;
  const loanVal = Form.useWatch('loanAmount', form) || 0;

  const initDeliveryFlow = useCallback(async () => {
    if (!loadingSheet) return;
    setLoading(true);
    try {
      // Fetch full RepOrder to get shops and items
      const repOrderId = loadingSheet.repOrderId || loadingSheet.repOrder?.id;
      if (repOrderId) {
        const orderData = await repOrderApi.get(String(repOrderId));
        setRepOrder(orderData);
      }

      // Check if delivery exists or create one
      if (loadingSheet.activeDeliveryId) {
        const delData = await deliveryApi.get(String(loadingSheet.activeDeliveryId));
        setActiveDelivery(delData);
      } else {
        // Create new active delivery for this loading sheet (requires loadingSheetId and deliveryDate)
        const dateStr = loadingSheet.loadingDate
          ? dayjs(loadingSheet.loadingDate).format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD');
        const newDel = await deliveryApi.create({
          loadingSheetId: Number(loadingSheet.id),
          deliveryDate: dateStr,
        });
        setActiveDelivery(newDel);
      }
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: {
            message?: string;
            detail?: string;
            title?: string;
            errors?: Array<{ field: string; message: string }>;
            properties?: { errors?: Array<{ field: string; message: string }> };
          };
        };
      };
      console.error('Failed to init delivery flow:', error, err?.response?.data);
      const data = err?.response?.data;
      const errorsList = data?.errors || data?.properties?.errors;
      if (errorsList && Array.isArray(errorsList) && errorsList.length > 0) {
        const errMsgs = errorsList.map(e => `${e.field}: ${e.message}`).join(', ');
        message.error(`Validation Error (${errMsgs})`);
      } else {
        message.error(data?.detail || data?.message || data?.title || 'Failed to initialize delivery workflow.');
      }
    } finally {
      setLoading(false);
    }
  }, [loadingSheet, message]);

  useEffect(() => {
    if (visible && loadingSheet) {
      initDeliveryFlow();
    } else {
      setRepOrder(null);
      setActiveDelivery(null);
      setRecordingShopId(null);
      setActiveShop(null);
    }
  }, [visible, loadingSheet, initDeliveryFlow]);

  const handleOpenRecordShop = (shopData: unknown) => {
    setActiveShop(shopData as ShopRowData);
    setRecordingShopId(getShopId(shopData));
    form.resetFields();

    const dataObj = (shopData && typeof shopData === 'object' ? shopData : {}) as Record<string, unknown>;
    const itemsList = Array.isArray(dataObj.items) ? dataObj.items : [];

    const totalNet = itemsList.reduce((sum: number, item: unknown) => {
      const it = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      return sum + Number(it.netAmount || ((Number(it.quantity || 0)) * (Number(it.rate || 0))));
    }, 0);

    form.setFieldsValue({
      items: itemsList.map((i: unknown) => {
        const it = (i && typeof i === 'object' ? i : {}) as Record<string, unknown>;
        const prod = (it.product && typeof it.product === 'object' ? it.product : {}) as Record<string, unknown>;
        const rawPid = prod.id !== undefined ? prod.id : (it.productId !== undefined ? it.productId : it.id);
        const rawPname = prod.name !== undefined ? prod.name : (it.productName !== undefined ? it.productName : (it.name || ''));
        return {
          productId: Number(rawPid),
          productName: String(rawPname || ''),
          quantityDelivered: Number(it.quantity || 0),
          unitType: String(it.unitType || 'PCS'),
          rate: Number(it.rate || 0),
          discountAmount: Number(it.discountAmount || 0),
          isFreeItem: Boolean(it.isFreeItem || false),
        };
      }),
      cashAmount: totalNet,
      chequeAmount: 0,
      loanAmount: 0,
      chequeNo: '',
      chequeBankName: '',
      chequeDate: null,
    });
  };

  const handleSaveShopDelivery = async () => {
    if (!activeDelivery || !activeShop) return;
    try {
      const values = await form.validateFields();
      setSubmittingShop(true);

      const payments: Array<{
        paymentMethod: string;
        amount: number;
        chequeNo?: string;
        chequeBankName?: string;
        chequeDate?: string;
      }> = [];
      if (values.cashAmount && Number(values.cashAmount) > 0) {
        payments.push({
          paymentMethod: 'CASH',
          amount: Number(values.cashAmount),
        });
      }
      if (values.chequeAmount && Number(values.chequeAmount) > 0) {
        payments.push({
          paymentMethod: 'CHEQUE',
          amount: Number(values.chequeAmount),
          chequeNo: values.chequeNo || 'CHQ-UNKNOWN',
          chequeBankName: values.chequeBankName || 'Bank',
          chequeDate: values.chequeDate ? values.chequeDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        });
      }

      const allItems = form.getFieldValue('items') || [];
      const payload = {
        items: allItems.map((i: FormItemData & Record<string, unknown>, index: number) => {
          const validated = (values.items?.[index] || {}) as Record<string, unknown>;
          const rawPid = i.productId !== undefined && !Number.isNaN(Number(i.productId))
            ? i.productId
            : (validated.productId !== undefined && !Number.isNaN(Number(validated.productId))
                ? validated.productId
                : i.id);
          return {
            productId: Number(rawPid),
            quantityDelivered: Number(validated.quantityDelivered !== undefined ? validated.quantityDelivered : (i.quantityDelivered || 0)),
            unitType: String(i.unitType || validated.unitType || 'PCS'),
            rate: Number(validated.rate !== undefined ? validated.rate : (i.rate || 0)),
            discountAmount: Number(validated.discountAmount !== undefined ? validated.discountAmount : (i.discountAmount || 0)),
            isFreeItem: Boolean(i.isFreeItem || validated.isFreeItem),
          };
        }),
        returns: [],
        payments,
      };

      await deliveryApi.recordShop(String(activeDelivery.id), getShopId(activeShop), payload);
      message.success(`Delivery and payments recorded for shop ${getShopName(activeShop)}`);

      // Refresh delivery status
      const updatedDel = await deliveryApi.get(String(activeDelivery.id));
      setActiveDelivery(updatedDel);
      setRecordingShopId(null);
      setActiveShop(null);
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: {
            message?: string;
            detail?: string;
            title?: string;
            errors?: Array<{ field: string; message: string }>;
            properties?: { errors?: Array<{ field: string; message: string }> };
          };
        };
      };
      console.error('Record shop delivery failed:', error, err?.response?.data);
      const data = err?.response?.data;
      const errorsList = data?.errors || data?.properties?.errors;
      if (errorsList && Array.isArray(errorsList) && errorsList.length > 0) {
        const errMsgs = errorsList.map(e => `${e.field}: ${e.message}`).join(', ');
        message.error(`Validation Error (${errMsgs})`);
      } else {
        message.error(data?.detail || data?.message || data?.title || 'Failed to record shop delivery.');
      }
    } finally {
      setSubmittingShop(false);
    }
  };


  if (!loadingSheet) return null;

  const recordedShopIds = new Set(
    activeDelivery?.shops?.map(s => getShopId(s as unknown as ShopRowData)) || []
  );

  const calculateNetBill = () => {
    const items = form.getFieldValue('items') || [];
    return items.reduce((sum: number, i: FormItemData) => {
      const q = Number(i.quantityDelivered || 0);
      const r = Number(i.rate || 0);
      const d = Number(i.discountAmount || 0);
      return sum + (q * r - d);
    }, 0);
  };

  return (
    <Modal
      title={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--color-primary)',
          fontWeight: 600,
          fontSize: '18px',
        }}>
          <CarOutlined />
          <span>Unload to Shop & Payment Collection — Sheet #{loadingSheet.id}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        recordingShopId ? null : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 0' }}>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        )
      }
      mask={{ closable: false }}
      destroyOnHidden
      styles={{
        body: { paddingBottom: '8px' },
      }}
    >
      <Form form={form} component={false}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : recordingShopId && activeShop ? (
          // ─── RECORD SHOP FORM STEP ───────────────────────────────────────────
          <div className="py-2">
            <div className="flex justify-between items-center mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <Title level={5} className="m-0 text-slate-800">
                  <ShopOutlined className="mr-2 text-emerald-600" />
                  Unloading at: <Text strong>{getShopName(activeShop)}</Text>
                </Title>
                <Text type="secondary" className="text-xs">
                  Owner: {getOwnerName(activeShop) || 'N/A'} | Phone: {getPhone(activeShop)}
                </Text>
              </div>
              <Button size="small" onClick={() => { setRecordingShopId(null); setActiveShop(null); }}>
                Back to Shop List
              </Button>
            </div>

            <div className="space-y-4">
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--color-border-default)'
              }}>
                1. Delivered Items
              </div>
            <Form.List name="items">
              {(fields) => (
                <Table
                  dataSource={fields}
                  pagination={false}
                  size="small"
                  className="mb-6"
                  columns={[
                    {
                      title: 'Product',
                      key: 'productName',
                      render: (_, field) => {
                        const items = form.getFieldValue('items');
                        return (
                          <>
                            <Form.Item name={[field.name, 'productId']} hidden noStyle>
                              <Input />
                            </Form.Item>
                            <Form.Item name={[field.name, 'productName']} hidden noStyle>
                              <Input />
                            </Form.Item>
                            <Form.Item name={[field.name, 'unitType']} hidden noStyle>
                              <Input />
                            </Form.Item>
                            <Form.Item name={[field.name, 'isFreeItem']} hidden noStyle>
                              <Input />
                            </Form.Item>
                            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                              {items[field.name]?.productName}
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
                        <Form.Item name={[field.name, 'quantityDelivered']} noStyle>
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
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                            fontVariantNumeric: 'tabular-nums',
                          }}>
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
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '16px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--color-border-default)'
            }}>
              2. Payment Collection Breakdown (Cash / Cheque / Loan)
            </div>
            <Card styles={{ body: { padding: '20px' } }} style={{ border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="cashAmount" label="Cash Amount (Rs)">
                    <InputNumber min={0} className="w-full" size="large" style={{ fontVariantNumeric: 'tabular-nums' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="chequeAmount" label="Cheque Amount (Rs)">
                    <InputNumber min={0} className="w-full" size="large" style={{ fontVariantNumeric: 'tabular-nums' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="loanAmount" label="Loan / Credit (Rs)">
                    <InputNumber min={0} className="w-full" size="large" placeholder="Auto / Explicit credit" style={{ fontVariantNumeric: 'tabular-nums' }} />
                  </Form.Item>
                </Col>
              </Row>

              {Number(chequeVal) > 0 && (
                <div style={{
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginTop: '8px'
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    marginBottom: '12px'
                  }}>
                    Cheque Details
                  </div>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="chequeNo" label="Cheque No" rules={[{ required: true, message: 'Required' }]}>
                        <Input placeholder="e.g. CHQ-982341" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="chequeBankName" label="Bank Name" rules={[{ required: true, message: 'Required' }]}>
                        <Input placeholder="e.g. BOC / Commercial Bank" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="chequeDate" label="Cheque Date" rules={[{ required: true, message: 'Required' }]}>
                        <DatePicker className="w-full" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              )}
            </Card>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginTop: '24px'
            }}>
              <div aria-live="polite" role="status" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', marginRight: '8px' }}>Total Net Bill:</span>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Rs. {calculateNetBill().toLocaleString()}
                  </span>
                </div>
                
                <div style={{ width: '1px', height: '24px', background: 'var(--color-border-default)' }} />
                
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
                          fontSize: '13px', 
                          fontWeight: 600, 
                          color: statusColor,
                          background: diff > 0 ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
                          padding: '4px 8px',
                          borderRadius: '4px'
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
              <Space size={12}>
                <Button onClick={() => { setRecordingShopId(null); setActiveShop(null); }}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleSaveShopDelivery}
                  loading={submittingShop}
                >
                  Save Shop Delivery
                </Button>
              </Space>
            </div>
          </div>
        </div>
        ) : (
          // ─── SHOP LIST FOR THIS LOADING SHEET ──────────────────────────────
          <div className="py-2">
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                marginBottom: '4px',
              }}>
                Driver: <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {loadingSheet.driverName || loadingSheet.driver?.name}
                </span>
                {' | '}
                Rep Order: <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {repOrder?.orderNumber || `Order #${repOrder?.id || ''}`}
                </span>
              </div>
              <div style={{
                fontSize: '13px',
                color: 'var(--color-text-tertiary)',
                lineHeight: 1.5,
              }}>
                Select each shop visited during this delivery round to record exact Cash, Cheque, and Loan figures.
              </div>
            </div>

            <Table
              dataSource={repOrder?.shops || []}
              rowKey={(row) => getShopId(row)}
              pagination={false}
              size="middle"
              columns={[
                {
                  title: 'Shop Name',
                  key: 'shopName',
                  render: (_, r) => (
                    <div>
                      <Text strong className="text-slate-800">{getShopName(r)}</Text>
                      {getOwnerName(r) && <span className="text-xs text-slate-500 block">Owner: {getOwnerName(r)}</span>}
                    </div>
                  ),
                },
                {
                  title: 'Prev. Outstanding',
                  key: 'outstandingLoan',
                  align: 'right' as const,
                  render: (_, r) => {
                    const amount = Number(getOutstandingLoan(r));
                    const isZero = amount === 0;
                    return (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-sm)',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: isZero ? 400 : 600,
                        color: isZero
                          ? 'var(--color-text-tertiary)'
                          : 'var(--color-danger-text)',
                      }}>
                        Rs. {amount.toLocaleString()}
                      </span>
                    );
                  },
                },
                {
                  title: 'Items',
                  key: 'itemsCount',
                  align: 'center' as const,
                  render: (_, r) => (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--color-primary-subtle)',
                      color: 'var(--color-primary-text)',
                      border: '1px solid var(--color-primary-border)',
                    }}>
                      {r.items?.length || 0} Items
                    </span>
                  ),
                },
                {
                  title: 'Delivery Status',
                  key: 'status',
                  render: (_, r) => {
                    const isDone = recordedShopIds.has(getShopId(r));
                    return isDone ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase' as const,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        lineHeight: '18px',
                        background: 'var(--color-success-bg)',
                        color: 'var(--color-success-text)',
                        border: '1px solid var(--color-success-border)',
                      }}>
                        <CheckCircleOutlined style={{ fontSize: '11px' }} />
                        DELIVERED
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase' as const,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        lineHeight: '18px',
                        background: 'var(--color-warning-bg)',
                        color: 'var(--color-warning-text)',
                        border: '1px solid var(--color-warning-border)',
                      }}>
                        PENDING
                      </span>
                    );
                  },
                },
                {
                  title: 'Action',
                  key: 'action',
                  align: 'right',
                  render: (_, r) => {
                    const isDone = recordedShopIds.has(getShopId(r));
                    return (
                      <Button
                        type={isDone ? 'default' : 'primary'}
                        size="small"
                        icon={<DollarOutlined />}
                        onClick={() => handleOpenRecordShop(r)}
                        className={!isDone ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      >
                        {isDone ? 'Edit Collection' : 'Unload & Collect'}
                      </Button>
                    );
                  },
                },
              ]}
            />
          </div>
        )}
      </Form>
    </Modal>
  );
};
