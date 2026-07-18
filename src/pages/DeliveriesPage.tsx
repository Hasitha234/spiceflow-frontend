/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import {
  Button, Card, Col, DatePicker, Descriptions, Form, Input, InputNumber, Row, Select, Table, Tag, Tooltip, Typography, message, Space, Divider, Popconfirm,
} from 'antd';
import {
  PlusOutlined, EyeOutlined, CheckCircleOutlined, TruckOutlined, CloseCircleOutlined, ShopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { deliveryApi, loadingSheetApi, qrApi } from '../api/sales';
import apiClient from '../api/client';
import { ResponsiveModal } from '@/components/common/ResponsiveModal';

const { Title, Text } = Typography;

export function DeliveriesPage() {
  const [loading, setLoading] = useState(false);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [recordShopOpen, setRecordShopOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [qrVisits, setQrVisits] = useState<Record<string, string>>({});

  // Create form
  const [confirmedSheets, setConfirmedSheets] = useState<any[]>([]);
  const [createForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Record shop form
  const [shopForm] = Form.useForm();
  const [repOrderShops, setRepOrderShops] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await deliveryApi.list({ page: 0, size: 50 });
      setDeliveries(res?.content || []);
    } catch {
      message.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = async () => {
    try {
      const res = await loadingSheetApi.list({ page: 0, size: 200 });
      setConfirmedSheets((res?.content || []).filter((s: any) => s.status === 'CONFIRMED'));
      createForm.resetFields();
      setCreateOpen(true);
    } catch {
      message.error('Failed to load loading sheets');
    }
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setSubmitting(true);
      await deliveryApi.create({
        loadingSheetId: Number(values.loadingSheetId),
        deliveryDate: values.deliveryDate.format('YYYY-MM-DD'),
      });
      message.success('Delivery started!');
      setCreateOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to create delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const viewDeliveryDetail = async (record: any) => {
    try {
      const detail = await deliveryApi.get(String(record.id));
      setSelectedDelivery(detail);
      // Fetch the rep order shops for this delivery's loading sheet
      if (detail.loadingSheet?.id) {
        const sheet = await loadingSheetApi.get(String(detail.loadingSheet.id));
        if (sheet.repOrder?.id) {
          const orderRes = await apiClient.get(`/api/v1/sales/rep-orders/${sheet.repOrder.id}`);
          setRepOrderShops(orderRes.data?.shops || []);
        }
      }
      
      try {
        const visits = await qrApi.getDeliveryVisits(record.id);
        const visitMap: Record<string, string> = {};
        visits.forEach((v: any) => {
          if (v.qrScannedAt) visitMap[String(v.shopId)] = v.qrScannedAt;
        });
        setQrVisits(visitMap);
      } catch {
        console.warn('Could not load QR visits for delivery');
      }

      setDetailOpen(true);
    } catch {
      message.error('Failed to load delivery details');
    }
  };

  const openRecordShop = (shop: any) => {
    setSelectedShop(shop);
    shopForm.resetFields();
    // Pre-fill items from rep order shop
    setRecordShopOpen(true);
  };

  const handleRecordShop = async () => {
    if (!selectedDelivery || !selectedShop) return;
    try {
      const values = await shopForm.validateFields();
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
          chequeDate: values.chequeDate ? values.chequeDate.format('YYYY-MM-DD') : null,
        });
      }

      await deliveryApi.recordShop(String(selectedDelivery.id), String(selectedShop.shopId || selectedShop.shop?.id), {
        items,
        returns: [],
        payments,
      });

      message.success(`Delivery recorded for ${selectedShop.shopName || selectedShop.shop?.name || 'shop'}`);
      setRecordShopOpen(false);
      viewDeliveryDetail(selectedDelivery); // Refresh
    } catch (err: any) {
      message.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to record shop delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShopClosed = async (shop: any) => {
    if (!selectedDelivery) return;
    try {
      // Record with zero items and zero payment — effectively cancelling
      await deliveryApi.recordShop(String(selectedDelivery.id), String(shop.shopId || shop.shop?.id), {
        items: [],
        returns: [],
        payments: [],
      });
      message.warning(`Shop "${shop.shopName || shop.shop?.name}" marked as closed/skipped`);
      viewDeliveryDetail(selectedDelivery);
    } catch (err: any) {
      message.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to skip shop');
    }
  };

  const handleComplete = async () => {
    if (!selectedDelivery) return;
    try {
      await deliveryApi.complete(String(selectedDelivery.id));
      message.success('Delivery completed! Final totals calculated.');
      setDetailOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to complete delivery');
    }
  };

  const columns = useMemo(() => [
    {
      title: 'ID', dataIndex: 'id', key: 'id', width: 60,
      render: (val: number) => <Text strong style={{ color: '#10b981' }}>#{val}</Text>,
    },
    {
      title: 'Loading Sheet', dataIndex: 'loadingSheetId', key: 'loadingSheetId', width: 120,
      render: (val: number) => <Text>LS-{val}</Text>,
    },
    {
      title: 'Delivery Date', dataIndex: 'deliveryDate', key: 'deliveryDate',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD') : '—',
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (status: string) => {
        const color = status === 'COMPLETED' ? 'green' : status === 'IN_PROGRESS' ? 'blue' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Total Sales', dataIndex: 'totalSalesValue', key: 'totalSalesValue', align: 'right' as const,
      render: (val: number) => <Text style={{ fontFamily: 'monospace' }}>{Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>,
    },
    {
      title: 'Collected', dataIndex: 'totalCollectedAmount', key: 'totalCollectedAmount', align: 'right' as const,
      render: (val: number) => <Text style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 600 }}>{Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>,
    },
    {
      title: 'Shops', key: 'shopCount',
      render: (_: unknown, record: any) => <Text>{record.shops?.length || 0}</Text>,
    },
    {
      title: 'Actions', key: 'actions', align: 'right' as const,
      render: (_: unknown, record: any) => (
        <Space>
          <Tooltip title="View / Manage">
            <Button type="text" icon={<EyeOutlined />} onClick={() => viewDeliveryDetail(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ], []);

  // Determine which shops are already delivered
  const deliveredShopIds = new Set((selectedDelivery?.shops || []).map((s: any) => String(s.shopId || s.shop?.id)));

  return (
    <div className="p-4 md:p-6">
      <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col>
          <Space>
            <div style={{ padding: '12px', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '12px' }}>
              <TruckOutlined style={{ fontSize: '24px', color: '#10b981' }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0 }}>Deliveries</Title>
              <Text type="secondary">Manage lorry deliveries to shops</Text>
            </div>
          </Space>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ height: '40px', paddingInline: '20px' }}>
            New Delivery
          </Button>
        </Col>
      </Row>

      <Card style={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <Table rowKey="id" loading={loading} dataSource={deliveries} columns={columns} pagination={{ pageSize: 10 }} scroll={{ x: 800 }} />
      </Card>

      {/* Create Delivery Modal */}
      <ResponsiveModal title="Start a New Delivery" open={createOpen} onCancel={() => setCreateOpen(false)}
        onOk={handleCreate} confirmLoading={submitting} okText="Start Delivery" width={500}>
        <Form form={createForm} layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item name="loadingSheetId" label="Confirmed Loading Sheet" rules={[{ required: true, message: 'Select a loading sheet' }]}>
            <Select size="large" placeholder="Select a CONFIRMED loading sheet" showSearch optionFilterProp="label"
              options={confirmedSheets.map((s: any) => ({
                label: `LS-${s.id} — ${s.driverName || 'Driver'} — ${s.repName || 'Rep'} (${dayjs(s.loadingDate).format('YYYY-MM-DD')})`,
                value: String(s.id),
              }))} />
          </Form.Item>
          <Form.Item name="deliveryDate" label="Delivery Date" rules={[{ required: true, message: 'Select date' }]} initialValue={dayjs()}>
            <DatePicker size="large" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </ResponsiveModal>

      {/* Delivery Detail Modal */}
      <ResponsiveModal title={<Space><TruckOutlined style={{ color: '#10b981' }} /> Delivery #{selectedDelivery?.id} — {selectedDelivery?.status}</Space>}
        open={detailOpen} onCancel={() => setDetailOpen(false)} width={900}
        footer={
          <Space>
            <Button onClick={() => setDetailOpen(false)}>Close</Button>
            {selectedDelivery?.status === 'IN_PROGRESS' && (
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleComplete}
                style={{ backgroundColor: '#10b981' }}>
                Complete Delivery
              </Button>
            )}
          </Space>
        }>
        {selectedDelivery && (
          <div>
            <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small" style={{ marginBottom: '24px' }}>
              <Descriptions.Item label="Delivery Date">{selectedDelivery.deliveryDate}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={selectedDelivery.status === 'COMPLETED' ? 'green' : 'blue'}>{selectedDelivery.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Loading Sheet">LS-{selectedDelivery.loadingSheet?.id}</Descriptions.Item>
              <Descriptions.Item label="Total Sales">LKR {Number(selectedDelivery.totalSalesValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
              <Descriptions.Item label="Total Returns">LKR {Number(selectedDelivery.totalReturnsValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
              <Descriptions.Item label="Total Collected"><Text style={{ color: '#10b981', fontWeight: 'bold' }}>LKR {Number(selectedDelivery.totalCollectedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text></Descriptions.Item>
            </Descriptions>

            <Divider orientation={"left" as any}>Shops in Route</Divider>

            {/* Shops from Rep Order */}
            {repOrderShops.map((shop: any, idx: number) => {
              const shopId = String(shop.shopId || shop.shop?.id);
              const isDelivered = deliveredShopIds.has(shopId);
              const deliveredData = (selectedDelivery.shops || []).find((s: any) => String(s.shopId || s.shop?.id) === shopId);

              return (
                <Card key={idx} size="small" style={{ marginBottom: '12px', borderLeft: isDelivered ? '4px solid #10b981' : '4px solid #faad14' }}
                  title={
                    <Space>
                      <ShopOutlined />
                      <span>{shop.shopName || shop.shop?.name || `Shop #${shopId}`}</span>
                      {isDelivered ? <Tag color="green">Delivered</Tag> : <Tag color="orange">Pending</Tag>}
                      {qrVisits[shopId] ? (
                        <Tag color="cyan">Scanned: {new Date(qrVisits[shopId]).toLocaleTimeString()}</Tag>
                      ) : (
                        <Tag className="text-slate-400">— Not Scanned</Tag>
                      )}
                    </Space>
                  }
                  extra={
                    !isDelivered && selectedDelivery.status === 'IN_PROGRESS' ? (
                      <Space>
                        <Button type="primary" size="small" onClick={() => openRecordShop(shop)}>
                          Record Delivery
                        </Button>
                        <Popconfirm title="Mark this shop as closed?" onConfirm={() => handleShopClosed(shop)}>
                          <Button danger size="small" icon={<CloseCircleOutlined />}>
                            Shop Closed
                          </Button>
                        </Popconfirm>
                      </Space>
                    ) : null
                  }>
                  {isDelivered && deliveredData && (
                    <Descriptions size="small" column={{ xs: 2, sm: 4 }}>
                      <Descriptions.Item label="Gross">{Number(deliveredData.grossBillAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
                      <Descriptions.Item label="Discount">{Number(deliveredData.totalDiscount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
                      <Descriptions.Item label="Paid">{Number(deliveredData.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
                      <Descriptions.Item label="Credit">{Number(deliveredData.creditAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Descriptions.Item>
                    </Descriptions>
                  )}
                  {!isDelivered && (
                    <div>
                      <Text type="secondary">Items ordered:</Text>
                      <Table dataSource={shop.items || []} rowKey="id" pagination={false} size="small" style={{ marginTop: '8px' }} scroll={{ x: 400 }}
                        columns={[
                          { title: 'Product', dataIndex: 'productName', key: 'productName' },
                          { title: 'Qty', dataIndex: 'quantity', key: 'quantity', align: 'right' },
                          { title: 'Rate', dataIndex: 'rate', key: 'rate', align: 'right', render: (v: number) => Number(v || 0).toFixed(2) },
                        ]} />
                    </div>
                  )}
                </Card>
              );
            })}

            {repOrderShops.length === 0 && (
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '24px' }}>
                No shop data available for this delivery's rep order.
              </Text>
            )}
          </div>
        )}
      </ResponsiveModal>

      {/* Record Shop Delivery Modal */}
      <ResponsiveModal title={`Record Delivery — ${selectedShop?.shopName || selectedShop?.shop?.name || 'Shop'}`}
        open={recordShopOpen} onCancel={() => setRecordShopOpen(false)}
        onOk={handleRecordShop} confirmLoading={submitting} okText="Save Delivery" width={700}>
        <Form form={shopForm} layout="vertical" style={{ marginTop: '16px' }}>
          <Title level={5}>Delivered Items</Title>
          <Form.List name="items" initialValue={(selectedShop?.items || []).map((item: any) => ({
            productId: item.productId || item.product?.id,
            productName: item.productName || item.product?.name,
            quantityDelivered: item.quantity,
            unitType: item.unitType || 'EACH',
            rate: item.rate,
            discountAmount: item.discountAmount || 0,
          }))}>
            {(fields) => (
              <Table dataSource={fields} rowKey="key" pagination={false} size="small" scroll={{ x: 500 }}
                columns={[
                  {
                    title: 'Product', key: 'product',
                    render: (_, field) => (
                      <>
                        <Form.Item name={[field.name, 'productId']} hidden><Input /></Form.Item>
                        <Form.Item name={[field.name, 'productName']} noStyle><Input variant="borderless" readOnly /></Form.Item>
                      </>
                    ),
                  },
                  {
                    title: 'Qty', key: 'qty', width: 80,
                    render: (_, field) => (
                      <>
                        <Form.Item name={[field.name, 'unitType']} hidden><Input /></Form.Item>
                        <Form.Item name={[field.name, 'quantityDelivered']} noStyle><InputNumber onFocus={(e) => e.target.select()} min={0} style={{ width: '100%' }} /></Form.Item>
                      </>
                    ),
                  },
                  {
                    title: 'Rate', key: 'rate', width: 100,
                    render: (_, field) => <Form.Item name={[field.name, 'rate']} noStyle><InputNumber onFocus={(e) => e.target.select()} min={0} step={0.01} style={{ width: '100%' }} /></Form.Item>,
                  },
                  {
                    title: 'Discount', key: 'discount', width: 100,
                    render: (_, field) => <Form.Item name={[field.name, 'discountAmount']} noStyle><InputNumber onFocus={(e) => e.target.select()} min={0} step={0.01} style={{ width: '100%' }} /></Form.Item>,
                  },
                ]} />
            )}
          </Form.List>

          <Divider />
          <Title level={5}>Payment Collection</Title>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="cashAmount" label="Cash Amount">
                <InputNumber onFocus={(e) => e.target.select()} size="large" min={0} step={0.01} precision={2} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="chequeAmount" label="Cheque Amount">
                <InputNumber onFocus={(e) => e.target.select()} size="large" min={0} step={0.01} precision={2} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="chequeNo" label="Cheque No">
                <Input size="large" placeholder="CHQ-..." />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="chequeBankName" label="Bank Name">
                <Input size="large" placeholder="Bank name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="chequeDate" label="Cheque Date">
                <DatePicker size="large" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Text type="secondary">Any remaining balance after Cash + Cheque will be added as a Loan (credit) to the shop's outstanding balance.</Text>
        </Form>
      </ResponsiveModal>
    </div>
  );
}

