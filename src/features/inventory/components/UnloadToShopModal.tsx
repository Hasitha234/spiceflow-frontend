import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Table, Button, Form, InputNumber, Input, DatePicker, Typography, Card, Space, Tag, Divider, message, Spin, Row, Col } from 'antd';
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
  onSuccess: () => void;
}

export const UnloadToShopModal: React.FC<UnloadToShopModalProps> = ({
  visible,
  loadingSheet,
  onClose,
  onSuccess,
}) => {
  const [repOrder, setRepOrder] = useState<RepOrder | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(false);
  const [recordingShopId, setRecordingShopId] = useState<string | null>(null);
  const [activeShop, setActiveShop] = useState<ShopRowData | null>(null);
  const [submittingShop, setSubmittingShop] = useState(false);
  const [completingDelivery, setCompletingDelivery] = useState(false);
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
        // Create new active delivery for this loading sheet
        const newDel = await deliveryApi.create({ loadingSheetId: Number(loadingSheet.id) });
        setActiveDelivery(newDel);
      }
    } catch (error: unknown) {
      console.error('Failed to init delivery flow:', error);
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err?.response?.data?.message || 'Failed to initialize delivery workflow.');
    } finally {
      setLoading(false);
    }
  }, [loadingSheet]);

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
        return {
          productId: Number(prod.id),
          productName: String(prod.name || ''),
          quantityDelivered: Number(it.quantity || 0),
          unitType: String(it.unitType || 'PCS'),
          rate: Number(it.rate || 0),
          discountAmount: 0,
          isFreeItem: false,
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

      const payload = {
        items: values.items.map((i: FormItemData) => ({
          productId: i.productId,
          quantityDelivered: Number(i.quantityDelivered),
          unitType: i.unitType,
          rate: Number(i.rate),
          discountAmount: Number(i.discountAmount || 0),
          isFreeItem: i.isFreeItem || false,
        })),
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
      console.error('Record shop delivery failed:', error);
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err?.response?.data?.message || 'Failed to record shop delivery.');
    } finally {
      setSubmittingShop(false);
    }
  };

  const handleCompleteAllAndUnload = async () => {
    if (!activeDelivery) return;
    try {
      setCompletingDelivery(true);
      await deliveryApi.complete(String(activeDelivery.id));
      message.success('Delivery marked COMPLETED and unsold vehicle inventory unloaded back to MAIN warehouse!');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Complete delivery failed:', error);
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err?.response?.data?.message || 'Failed to complete delivery.');
    } finally {
      setCompletingDelivery(false);
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
        <div className="flex items-center gap-2 text-emerald-700 font-semibold text-lg">
          <CarOutlined />
          <span>Unload to Shop & Payment Collection — Sheet #{loadingSheet.id}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose} disabled={completingDelivery}>
          Close & Resume Later
        </Button>,
        <Button
          key="complete"
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleCompleteAllAndUnload}
          loading={completingDelivery}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Complete Delivery & Return Unsold Stock to Warehouse
        </Button>,
      ]}
      mask={{ closable: false }}
      destroyOnHidden
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
              <Title level={5} className="text-slate-700 text-sm mb-2">1. Delivered Items</Title>
            <Form.List name="items">
              {(fields) => (
                <Table
                  dataSource={fields}
                  pagination={false}
                  size="small"
                  className="mb-6 border rounded"
                  columns={[
                    {
                      title: 'Product',
                      key: 'productName',
                      render: (_, field) => {
                        const items = form.getFieldValue('items');
                        return <Text strong>{items[field.name]?.productName}</Text>;
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
                          <InputNumber min={0} className="w-full" />
                        </Form.Item>
                      ),
                    },
                    {
                      title: 'Discount (Rs)',
                      key: 'discountAmount',
                      width: 130,
                      render: (_, field) => (
                        <Form.Item name={[field.name, 'discountAmount']} noStyle>
                          <InputNumber min={0} className="w-full" />
                        </Form.Item>
                      ),
                    },
                  ]}
                />
              )}
            </Form.List>

            <Divider className="my-4" />

            <Title level={5} className="text-slate-700 text-sm mb-3">2. Payment Collection Breakdown (Cash / Cheque / Loan)</Title>
            <Card className="bg-slate-50 border-slate-200 mb-4">
              <Row gutter={16} className="mb-4">
                <Col span={8}>
                  <Form.Item name="cashAmount" label={<Text strong className="text-emerald-700">💵 Cash Amount (Rs)</Text>}>
                    <InputNumber min={0} className="w-full" size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="chequeAmount" label={<Text strong className="text-blue-700">🏦 Cheque Amount (Rs)</Text>}>
                    <InputNumber min={0} className="w-full" size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="loanAmount" label={<Text strong className="text-amber-700">📝 Loan / Credit (Rs)</Text>}>
                    <InputNumber min={0} className="w-full" size="large" placeholder="Auto / Explicit credit" />
                  </Form.Item>
                </Col>
              </Row>

              {Number(chequeVal) > 0 && (
                <div className="bg-blue-50/60 p-4 rounded border border-blue-200 mt-2">
                  <Text strong className="text-blue-800 block mb-2 text-xs">CHEQUE DETAILS REQUIRED</Text>
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

            <div className="flex justify-between items-center bg-white p-4 rounded border border-slate-200 shadow-sm">
              <div>
                <Text type="secondary">Total Net Bill: </Text>
                <Text strong className="text-lg mr-6">Rs. {calculateNetBill().toLocaleString()}</Text>
                <Text type="secondary">Total Entered: </Text>
                <Text strong className="text-lg text-emerald-600">
                  Rs. {(Number(cashVal || 0) + Number(chequeVal || 0) + Number(loanVal || 0)).toLocaleString()}
                </Text>
              </div>
              <Space>
                <Button onClick={() => { setRecordingShopId(null); setActiveShop(null); }}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleSaveShopDelivery}
                  loading={submittingShop}
                  className="bg-emerald-600 hover:bg-emerald-700"
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
            <div className="mb-4">
              <Text type="secondary" className="block">
                Driver: <Text strong>{loadingSheet.driverName || loadingSheet.driver?.name}</Text> | Rep Order: <Text strong>{repOrder?.orderNumber || `Order #${repOrder?.id || ''}`}</Text>
              </Text>
              <Text className="text-xs text-slate-500">
                Select each shop visited during this delivery round to record exact Cash, Cheque, and Loan figures.
              </Text>
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
                  title: 'Previous Outstanding Loan',
                  key: 'outstandingLoan',
                  render: (_, r) => (
                    <Text className="text-amber-700 font-medium">
                      Rs. {Number(getOutstandingLoan(r)).toLocaleString()}
                    </Text>
                  ),
                },
                {
                  title: 'Items Count',
                  key: 'itemsCount',
                  render: (_, r) => <Tag color="blue">{r.items?.length || 0} Items</Tag>,
                },
                {
                  title: 'Delivery Status',
                  key: 'status',
                  render: (_, r) => {
                    const isDone = recordedShopIds.has(getShopId(r));
                    return isDone ? (
                      <Tag color="success" icon={<CheckCircleOutlined />}>Unloaded & Recorded</Tag>
                    ) : (
                      <Tag color="default">Pending Unload</Tag>
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
