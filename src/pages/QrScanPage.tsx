import { useState } from 'react';
import { 
  Button, Card, Typography, message, Result, List as AntList, 
  Drawer, Form, InputNumber, Input, Tag, Divider, Spin
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
      }
    } catch (err: any) {
      message.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to verify QR code');
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
    } catch (err: any) {
      message.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordDelivery = async () => {
    if (!shop || !selectedSheet) return;
    
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const items = (values.items || []).map((item: any) => ({
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
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to record delivery');
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
        title={`Unload Order - ${selectedSheet?.sheetNumber}`}
        placement="bottom"
        height="85vh"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        footer={
          <div className="flex gap-3 p-2">
            <Button onClick={() => setDrawerOpen(false)} className="flex-1">Cancel</Button>
            <Button 
              type="primary" 
              loading={submitting} 
              onClick={handleRecordDelivery}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500"
            >
              Confirm Delivery
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Title level={5} className="!mb-4 text-emerald-600">Delivered Items</Title>
          <Form.List name="items">
            {(fields) => (
              <div className="space-y-4 mb-8">
                {fields.map(({ key, name, ...restField }) => {
                  const item = selectedSheet?.items[name];
                  return (
                    <Card size="small" key={key} className="bg-slate-50 dark:bg-slate-800/50">
                      <div className="font-medium mb-2">{item?.productName}</div>
                      <div className="flex gap-4">
                        <Form.Item
                          {...restField}
                          name={[name, 'quantityDelivered']}
                          label="Qty"
                          className="!mb-0 flex-1"
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <InputNumber min={0} className="w-full" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'discountAmount']}
                          label="Discount"
                          className="!mb-0 flex-1"
                        >
                          <InputNumber min={0} className="w-full" />
                        </Form.Item>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Form.List>

          <Divider />
          <Title level={5} className="!mb-4 text-emerald-600">Payment Collection</Title>

          <Form.Item name="cashAmount" label="Cash Amount (LKR)">
            <InputNumber className="w-full" size="large" min={0} precision={2} />
          </Form.Item>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4">
            <Form.Item name="chequeAmount" label="Cheque Amount (LKR)" className="!mb-0">
              <InputNumber className="w-full" min={0} precision={2} />
            </Form.Item>
            <Form.Item name="chequeNo" label="Cheque Number" className="!mb-0">
              <Input placeholder="Enter cheque number" />
            </Form.Item>
            <Form.Item name="chequeBankName" label="Bank Name" className="!mb-0">
              <Input placeholder="Enter bank name" />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}
