import { useState } from 'react';
import { Button, Card, Col, Descriptions, Input, InputNumber, Row, Tag, Typography, message, Space, Result, List as AntList } from 'antd';
import { QrcodeOutlined, CheckCircleOutlined, CameraOutlined, ShopOutlined } from '@ant-design/icons';
import apiClient from '../api/client';

const { Title, Text } = Typography;

interface OrderItem {
  productName: string;
  quantity: number;
  rate: number;
  unitType: string;
}

interface OrderDetail {
  shopName: string;
  items: OrderItem[];
}

interface VisitResult {
  visitId: number;
  shopId: number;
  shopName: string;
  visitedAt: string;
  verified: boolean;
  orderDetails: OrderDetail[];
}

export function QrScanPage() {
  const [qrInput, setQrInput] = useState('');
  const [deliveryId, setDeliveryId] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VisitResult | null>(null);
  const [verified, setVerified] = useState(false);

  const parseQrCode = (qr: string): { shopId: number; tenantId: number } | null => {
    // Format: SPICEFLOW:SHOP:<tenantId>:<shopId>
    const parts = qr.split(':');
    if (parts.length >= 4 && parts[0] === 'SPICEFLOW' && parts[1] === 'SHOP') {
      return { tenantId: Number(parts[2]), shopId: Number(parts[3]) };
    }
    return null;
  };

  const handleScan = async () => {
    if (!qrInput.trim()) {
      message.warning('Please enter or scan a QR code');
      return;
    }

    const parsed = parseQrCode(qrInput.trim());
    if (!parsed) {
      message.error('Invalid QR code format. Expected: SPICEFLOW:SHOP:<tenantId>:<shopId>');
      return;
    }

    setScanning(true);
    try {
      const res = await apiClient.post('/api/v1/sales/qr/verify', {
        shopId: parsed.shopId,
        deliveryId: deliveryId,
        latitude: null,
        longitude: null,
        notes: 'QR scan verification',
      });
      setResult(res.data);
      setVerified(true);
      message.success('Shop visit verified!');
    } catch (err: any) {
      message.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to verify QR code');
    } finally {
      setScanning(false);
    }
  };

  // Try to get browser geolocation
  const handleScanWithGPS = async () => {
    if (!qrInput.trim()) {
      message.warning('Please enter or scan a QR code');
      return;
    }

    const parsed = parseQrCode(qrInput.trim());
    if (!parsed) {
      message.error('Invalid QR code format');
      return;
    }

    setScanning(true);

    let lat: number | null = null;
    let lng: number | null = null;

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch {
        // GPS not available, continue without it
      }
    }

    try {
      const res = await apiClient.post('/api/v1/sales/qr/verify', {
        shopId: parsed.shopId,
        deliveryId: deliveryId,
        latitude: lat,
        longitude: lng,
        notes: 'QR scan verification with GPS',
      });
      setResult(res.data);
      setVerified(true);
      message.success('Shop visit verified with GPS!');
    } catch (err: any) {
      message.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to verify');
    } finally {
      setScanning(false);
    }
  };

  const reset = () => {
    setQrInput('');
    setResult(null);
    setVerified(false);
    setDeliveryId(null);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <QrcodeOutlined style={{ fontSize: '48px', color: '#10b981', marginBottom: '12px' }} />
          <Title level={3} style={{ margin: 0 }}>Shop QR Verification</Title>
          <Text type="secondary">Scan or enter the shop QR code to verify your visit</Text>
        </div>

        {!verified ? (
          <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>Delivery ID (Optional)</Text>
                <InputNumber onFocus={(e) => e.target.select()}
                  size="large"
                  style={{ width: '100%', marginTop: '8px' }}
                  placeholder="Enter delivery ID if available"
                  value={deliveryId}
                  onChange={(val) => setDeliveryId(val)}
                />
              </div>

              <div>
                <Text strong>QR Code Data</Text>
                <Input.TextArea
                  size="large"
                  rows={3}
                  style={{ marginTop: '8px' }}
                  placeholder="Paste QR code data here or scan using camera..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                />
              </div>

              <Row gutter={12}>
                <Col span={12}>
                  <Button type="primary" block size="large" icon={<CheckCircleOutlined />}
                    loading={scanning} onClick={handleScan}
                    style={{ backgroundColor: '#10b981', height: '48px' }}>
                    Verify Visit
                  </Button>
                </Col>
                <Col span={12}>
                  <Button block size="large" icon={<CameraOutlined />}
                    loading={scanning} onClick={handleScanWithGPS}
                    style={{ height: '48px' }}>
                    Verify + GPS
                  </Button>
                </Col>
              </Row>
            </Space>
          </Card>
        ) : (
          <>
            <Result
              status="success"
              title="Visit Verified!"
              subTitle={`Shop: ${result?.shopName} — Verified at ${result?.visitedAt ? new Date(result.visitedAt).toLocaleString() : 'now'}`}
              extra={
                <Button type="primary" onClick={reset} style={{ backgroundColor: '#10b981' }}>
                  Scan Another Shop
                </Button>
              }
            />

            {/* Show order details if available */}
            {result?.orderDetails && result.orderDetails.length > 0 && (
              <Card title={<Space><ShopOutlined /> Order Details for {result.shopName}</Space>}
                style={{ borderRadius: '12px' }}>
                {result.orderDetails.map((detail, idx) => (
                  <div key={idx}>
                    <AntList
                      size="small"
                      dataSource={detail.items}
                      renderItem={(item: OrderItem) => (
                        <AntList.Item>
                          <AntList.Item.Meta
                            title={item.productName}
                            description={
                              <Space>
                                <Tag color="blue">Qty: {item.quantity}</Tag>
                                <Tag color="green">Rate: {Number(item.rate || 0).toFixed(2)}</Tag>
                                <Tag>{item.unitType}</Tag>
                              </Space>
                            }
                          />
                        </AntList.Item>
                      )}
                    />
                  </div>
                ))}
              </Card>
            )}
          </>
        )}
      </Space>
    </div>
  );
}

