import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  );
}
