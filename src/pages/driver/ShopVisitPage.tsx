import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Button, Card, Typography, message, Form, InputNumber, DatePicker, Row, Col, Input, Spin
} from 'antd';
import {
  CheckCircleOutlined, ShopOutlined, CloseCircleOutlined, ArrowLeftOutlined, WarningOutlined
} from '@ant-design/icons';
import { qrApi, deliveryApi } from '../../api/sales';

const { Title, Text } = Typography;

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

export function ShopVisitPage() {
  const { shopId, deliveryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [shopName, setShopName] = useState<string>('');
  const [sheetData, setSheetData] = useState<LoadingSheet | null>(null);

  const initializeForm = (sheet: LoadingSheet) => {
    form.setFieldsValue({
      items: sheet.items.map((i: OrderItem) => ({
        productId: i.productId,
        quantityDelivered: i.quantity,
        unitType: i.unitType,
        rate: i.rate,
        discountAmount: 0,
      })),
      cashAmount: 0,
      chequeAmount: 0,
    });
  };

  const fetchData = async () => {
    if (!shopId || !deliveryId) return;
    setLoading(true);
    try {
      const sheets = await qrApi.getTodaySheets(shopId);
      const sheet = sheets.find((s: LoadingSheet) => String(s.deliveryId) === deliveryId);
      if (sheet) {
        setSheetData(sheet);
        setShopName(`Shop #${shopId}`); 
        initializeForm(sheet);
      } else {
        message.error('Delivery not found');
        navigate('/qr-scan');
      }
    } catch {
      message.error('Failed to load shop visit data');
      navigate('/qr-scan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.shop && location.state?.sheet) {
      setShopName(location.state.shop.shopName);
      setSheetData(location.state.sheet);
      initializeForm(location.state.sheet);
    } else {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, deliveryId]);

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

  const handleCancelOrder = async () => {
    if (!shopId || !deliveryId) return;
    setCancelling(true);
    try {
      await deliveryApi.recordShop(deliveryId, shopId, {
        items: [],
        returns: [],
        payments: [],
        notes: 'Order cancelled by driver (Shop Closed / No Time)'
      });
      message.success('Order cancelled successfully');
      navigate('/qr-scan');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleRecordDelivery = async () => {
    if (!shopId || !deliveryId) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const items = (values.items || []).map((item: Record<string, unknown>) => ({
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

      await deliveryApi.recordShop(deliveryId, shopId, {
        items,
        returns: [],
        payments,
      });

      message.success(`Delivery recorded successfully!`);
      navigate('/qr-scan');
    } catch (err: unknown) {
      const e = err as { errorFields?: unknown; response?: { data?: { message?: string } } };
      if (e.errorFields) return;
      message.error(e?.response?.data?.message || 'Failed to record delivery');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !sheetData) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
        <Spin size="large" tip="Loading visit details..." />
      </div>
    );
  }

  const netBill = calculateNetBill();
  const entered = Number(cashVal) + Number(chequeVal) + Number(loanVal);
  const diff = netBill - entered;

  return (
    <div className="max-w-3xl mx-auto w-full pb-32 pt-4 px-4 sm:px-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/qr-scan')}
          className="hover:bg-slate-100 dark:hover:bg-slate-800"
        />
        <div>
          <Title level={4} className="!m-0 !text-slate-800 dark:!text-white flex items-center gap-2">
            <ShopOutlined className="text-emerald-500" />
            {shopName}
          </Title>
          <Text className="text-slate-500 font-medium">Sheet #{sheetData.sheetNumber}</Text>
        </div>
      </div>

      <Form form={form} layout="vertical" component={false}>
        <Card className="mb-6 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 shadow-sm rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-red-600 dark:text-red-400 mb-1 flex items-center gap-2 text-base">
                <WarningOutlined />
                Shop Closed / Unable to Deliver?
              </div>
              <Text className="text-slate-500 text-sm">Cancel this order if you cannot make the delivery right now.</Text>
            </div>
            <Button 
              danger
              icon={<CloseCircleOutlined />} 
              onClick={handleCancelOrder}
              loading={cancelling}
              className="sm:w-auto w-full font-medium"
            >
              Cancel Order
            </Button>
          </div>
        </Card>

        <Card className="mb-6 shadow-sm border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden" 
              headStyle={{ background: 'rgba(16, 185, 129, 0.05)', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}
              title={<span className="text-emerald-700 dark:text-emerald-400 font-semibold">1. Delivered Items</span>}>
          <div className="space-y-4">
            <Form.List name="items">
              {(fields) => (
                <div className="overflow-x-auto -mx-6 px-6">
                  <div className="min-w-[500px]">
                    <div className="flex items-center pb-2 mb-3 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-500">
                      <div className="w-1/3">Product</div>
                      <div className="w-1/6 text-right">Qty</div>
                      <div className="w-1/6 text-right">Rate</div>
                      <div className="w-1/6 text-right">Disc</div>
                      <div className="w-1/6 text-right">Total</div>
                    </div>
                    
                    {fields.map((field) => {
                      const itemData = sheetData.items[field.name];
                      const itemsVals = form.getFieldValue('items') || [];
                      const curr = itemsVals[field.name] || {};
                      const lineTotal = (Number(curr.quantityDelivered || 0) * Number(curr.rate || 0)) - Number(curr.discountAmount || 0);

                      return (
                        <div key={field.key} className="flex items-center py-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                          <div className="w-1/3 pr-2 flex flex-col justify-center">
                            <Form.Item name={[field.name, 'productId']} hidden><Input /></Form.Item>
                            <Form.Item name={[field.name, 'unitType']} hidden><Input /></Form.Item>
                            <Text strong className="text-sm capitalize leading-tight text-slate-700 dark:text-slate-300">{itemData?.productName}</Text>
                          </div>
                          <div className="w-1/6 px-1">
                            <Form.Item name={[field.name, 'quantityDelivered']} className="!mb-0" rules={[{ required: true }]}>
                              <InputNumber min={0} className="w-full text-right" controls={false} />
                            </Form.Item>
                          </div>
                          <div className="w-1/6 px-1">
                            <Form.Item name={[field.name, 'rate']} className="!mb-0">
                              <InputNumber min={0} className="w-full text-right" controls={false} />
                            </Form.Item>
                          </div>
                          <div className="w-1/6 px-1">
                            <Form.Item name={[field.name, 'discountAmount']} className="!mb-0">
                              <InputNumber min={0} className="w-full text-right" controls={false} />
                            </Form.Item>
                          </div>
                          <div className="w-1/6 pl-2 text-right">
                            <Text strong className="font-mono text-emerald-600 dark:text-emerald-400">
                              {lineTotal.toLocaleString()}
                            </Text>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Form.List>
          </div>
        </Card>

        <Card className="mb-6 shadow-sm border-slate-200 dark:border-slate-800 rounded-2xl" 
              headStyle={{ background: 'rgba(16, 185, 129, 0.05)', borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}
              title={<span className="text-emerald-700 dark:text-emerald-400 font-semibold">2. Payment Collection</span>}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item name="cashAmount" label="Cash Amount (Rs)" className="!mb-0 font-medium">
                <InputNumber min={0} className="w-full" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="chequeAmount" label="Cheque Amount (Rs)" className="!mb-0 font-medium">
                <InputNumber min={0} className="w-full" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="loanAmount" label="Loan / Credit (Rs)" className="!mb-0 font-medium">
                <InputNumber min={0} className="w-full" size="large" placeholder="Auto / Explicit credit" />
              </Form.Item>
            </Col>
          </Row>

          {Number(chequeVal) > 0 && (
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-semibold text-slate-500 mb-3">Cheque Details</div>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item name="chequeNo" label="Cheque No" rules={[{ required: true, message: 'Required' }]} className="!mb-0">
                    <Input placeholder="CHQ-982341" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="chequeBankName" label="Bank Name" rules={[{ required: true, message: 'Required' }]} className="!mb-0">
                    <Input placeholder="e.g. BOC" />
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
      </Form>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+56px)] left-0 right-0 sm:bottom-0 sm:pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 p-4 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex flex-col">
              <Text className="text-xs text-slate-500 uppercase font-semibold">Net Bill</Text>
              <Text className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">Rs {netBill.toLocaleString()}</Text>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div className="flex flex-col items-end sm:items-start">
              <Text className="text-xs text-slate-500 uppercase font-semibold">Entered</Text>
              <div className="flex items-center gap-2">
                <Text className={`text-lg font-bold font-mono ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  Rs {entered.toLocaleString()}
                </Text>
                {diff === 0 && netBill > 0 && <CheckCircleOutlined className="text-emerald-500" />}
              </div>
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleRecordDelivery}
            loading={submitting}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25 shadow-lg h-12 px-8 rounded-full text-base font-semibold"
          >
            Finish & Save
          </Button>

        </div>
      </div>
    </div>
  );
}
