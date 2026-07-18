import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { 
  Button, Card, Typography, message, Result, List as AntList, Tag, Spin
} from 'antd';
import { 
  CheckCircleOutlined, ShopOutlined, CloseCircleOutlined, InfoCircleOutlined, DollarOutlined 
} from '@ant-design/icons';
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
  const navigate = useNavigate();
  const [shop, setShop] = useState<ShopQrResponse | null>(null);
  const [loadingSheets, setLoadingSheets] = useState<LoadingSheet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSheets, setCompletedSheets] = useState<Record<number, boolean>>({});
  const [todayDelivery, setTodayDelivery] = useState<{
    loadingSheet?: { id: string | number };
    loadingSheetId?: string | number;
    status?: string;
    shops?: { id?: string; status?: string }[];
  } | null>(null);

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const res = await deliveryApi.list({ date: dayjs().format('YYYY-MM-DD'), size: 1 });
        if (res?.content?.length > 0) {
          const d = res.content[0];
          setTodayDelivery(d);
        }
      } catch {
        // Silently fail — route context is supplementary, not critical
      }
    };
    fetchToday();
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    setIsLoading(true);
    try {
      const shopData = await qrApi.resolveToken(decodedText);
      const sheets = await qrApi.getTodaySheets(shopData.shopId);
      
      if (sheets.length === 1) {
        // Automatically navigate if exactly one delivery is found
        message.success(`Found delivery for ${shopData.shopName}`);
        navigate(`/driver/visit/${shopData.shopId}/${sheets[0].deliveryId}`, {
          state: { shop: shopData, sheet: sheets[0] }
        });
      } else {
        setShop(shopData);
        setLoadingSheets(sheets);
        
        if (sheets.length === 0) {
          message.info(`No active deliveries found for ${shopData.shopName} today`);
        } else {
          message.success(`Found ${sheets.length} deliveries for ${shopData.shopName}`);
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; message?: string } } };
      message.error(e?.response?.data?.detail || e?.response?.data?.message || 'Failed to verify QR code');
    } finally {
      setIsLoading(false);
    }
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
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-160px)] md:min-h-[calc(100vh-120px)]">
      <div className="w-full max-w-2xl flex flex-col items-center justify-center">
        {!shop ? (
          <>
            <Card 
              className="w-full overflow-hidden"
              style={{
                border: '1px solid var(--color-border-default)',
                background: 'var(--color-surface-default)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="text-center mb-8">
                <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-primary-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                }}
              >
                <ShopOutlined style={{ fontSize: 28, color: 'var(--color-primary)' }} />
              </div>
              <Title level={3} style={{ marginBottom: 'var(--space-8)', color: 'var(--color-text-primary)' }}>Scan Shop QR</Title>
            </div>
            
            <QrCameraScanner 
              onScanSuccess={handleScanSuccess} 
            />
          </Card>

          {todayDelivery && (
            <Card
              className="w-full mt-6"
              style={{
                border: '1px solid var(--color-border-default)',
                background: 'var(--color-surface-default)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-tertiary)',
                letterSpacing: 'var(--tracking-wide)',
                textTransform: 'uppercase',
                marginBottom: 'var(--space-3)',
              }}>
                Today's Route
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'var(--color-text-secondary)' }}>Loading Sheet</Text>
                  <Text strong>LS-{todayDelivery.loadingSheetId || todayDelivery.loadingSheet?.id}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'var(--color-text-secondary)' }}>Status</Text>
                  <Tag color={todayDelivery.status === 'COMPLETED' ? 'green' : todayDelivery.status === 'IN_PROGRESS' ? 'blue' : 'orange'}>
                    {todayDelivery.status?.replace('_', ' ')}
                  </Tag>
                </div>
                {todayDelivery.shops && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: 'var(--color-text-secondary)' }}>Progress</Text>
                    <Text strong>
                      {todayDelivery.shops.filter((s: { id?: string; status?: string }) => s.status === 'DELIVERED').length} of {todayDelivery.shops.length} shops
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      ) : (
        <div className="space-y-6 w-full">
          <Card className="bg-emerald-900/20 border-emerald-500/30 rounded-2xl">
            <Result
              status="success"
              title={<span className="text-emerald-400">Shop Identified</span>}
              subTitle={<span className="text-emerald-200 text-lg">{shop.shopName}</span>}
              icon={<CheckCircleOutlined className="text-emerald-500" />}
            />
          </Card>

          <Title level={4} className="!mb-4">Today's Deliveries</Title>
          
          {loadingSheets.length === 0 ? (
            <Card className="text-center py-8 rounded-2xl">
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
                    className={`shadow-sm rounded-2xl transition-all ${isCompleted ? 'opacity-60 grayscale' : 'border-emerald-500/30'}`}
                    title={
                      <div className="flex justify-between items-center">
                        <span>Sheet: {sheet.sheetNumber || `LS-${sheet.loadingSheetId}`}</span>
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
                            title={<span className="font-medium text-slate-700 dark:text-slate-200">{item.productName}</span>}
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
                          Cancel
                        </Button>
                        <Button 
                          type="primary" 
                          icon={<DollarOutlined />}
                          onClick={() => navigate(`/driver/visit/${shop.shopId}/${sheet.deliveryId}`, { state: { shop, sheet } })}
                          className="bg-emerald-600 hover:bg-emerald-500 font-medium"
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

          <Button block size="large" onClick={resetScanner} className="mt-8 rounded-xl font-medium h-12">
            Scan Another Shop
          </Button>
        </div>
      )}
      </div>
    </div>
  );
}
