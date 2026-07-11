/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Button, Card, Col, DatePicker, Form, Modal, Row, Select, Table, Tag, Tooltip, Typography, message, Space, Descriptions,
} from 'antd';
import {
  PlusOutlined, CheckCircleOutlined, EyeOutlined, ContainerOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { loadingSheetApi, repOrderApi, driverApi } from '../api/sales';
import apiClient from '../api/client';

const { Title, Text } = Typography;

interface LoadingSheetRow {
  id: number;
  repOrderId: number;
  repName: string;
  driverName: string;
  loadingDate: string;
  status: string;
  items: any[];
  returns: any[];
}

export function LoadingSheetsPage() {
  const [loading, setLoading] = useState(false);
  const [sheets, setSheets] = useState<LoadingSheetRow[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<LoadingSheetRow | null>(null);

  // Create form data
  const [repOrders, setRepOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await loadingSheetApi.list({ page: 0, size: 50 });
      setSheets((res?.content as any) || []);
    } catch {
      message.error('Failed to load loading sheets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = async () => {
    try {
      const [ordersRes, driversRes, warehouseRes] = await Promise.all([
        repOrderApi.list({ page: 0, size: 200 }),
        driverApi.list({ page: 0, size: 200 }),
        apiClient.get('/api/v1/warehouses?size=200'),
      ]);
      setRepOrders((ordersRes?.content || []).filter((o: any) => o.loadingStatus === 'DRAFT' || o.status === 'DRAFT'));
      setDrivers(driversRes?.content || []);
      setWarehouses(warehouseRes.data?.content || []);
      form.resetFields();
      setCreateOpen(true);
    } catch {
      message.error('Failed to load form data');
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await loadingSheetApi.create({
        repOrderId: Number(values.repOrderId),
        driverId: Number(values.driverId),
        loadingDate: values.loadingDate.format('YYYY-MM-DD'),
      });
      message.success('Loading sheet created successfully');
      setCreateOpen(false);
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Failed to create loading sheet';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = useCallback(async (id: number) => {
    try {
      await loadingSheetApi.confirm(String(id));
      message.success('Loading sheet confirmed! Inventory transferred to vehicle.');
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Failed to confirm';
      message.error(msg);
    }
  }, [loadData]);

  const columns = useMemo(() => [
    {
      title: 'ID', dataIndex: 'id', key: 'id', width: 60,
      render: (val: number) => <Text strong style={{ color: '#10b981' }}>#{val}</Text>,
    },
    {
      title: 'Rep Order', dataIndex: 'repOrderId', key: 'repOrderId', width: 100,
      render: (val: number) => <Text>RO-{val}</Text>,
    },
    {
      title: 'Rep', dataIndex: 'repName', key: 'repName',
      render: (val: string) => val || '—',
    },
    {
      title: 'Driver', dataIndex: 'driverName', key: 'driverName',
      render: (val: string) => val || '—',
    },
    {
      title: 'Loading Date', dataIndex: 'loadingDate', key: 'loadingDate',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD') : '—',
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (status: string) => {
        const color = status === 'CONFIRMED' ? 'green' : status === 'DRAFT' ? 'orange' : 'blue';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Items', key: 'itemCount',
      render: (_: unknown, record: LoadingSheetRow) => <Text>{record.items?.length || 0}</Text>,
    },
    {
      title: 'Actions', key: 'actions', align: 'right' as const,
      render: (_: unknown, record: LoadingSheetRow) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />} onClick={() => { setSelectedSheet(record); setDetailOpen(true); }} />
          </Tooltip>
          {record.status === 'DRAFT' && (
            <Tooltip title="Confirm & Transfer Stock">
              <Button type="text" style={{ color: '#10b981' }} icon={<CheckCircleOutlined />}
                onClick={() => handleConfirm(record.id)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ], [handleConfirm]);

  return (
    <div style={{ padding: 'var(--space-8)' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Space>
            <div style={{ padding: '12px', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '12px' }}>
              <ContainerOutlined style={{ fontSize: '24px', color: '#10b981' }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0 }}>Loading Sheets</Title>
              <Text type="secondary">Load items from warehouse onto delivery vehicles</Text>
            </div>
          </Space>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
            style={{ height: '40px', paddingInline: '20px' }}>
            New Loading Sheet
          </Button>
        </Col>
      </Row>

      <Card 
        style={{ 
          borderRadius: 'var(--radius-lg)', 
          boxShadow: 'var(--shadow-none)', 
          border: '1px solid var(--color-border-default)',
          overflow: 'hidden'
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table rowKey="id" loading={loading} dataSource={sheets} columns={columns} pagination={{ pageSize: 10, className: 'px-4 py-3 m-0 border-t border-slate-100' }} className="spiceflow-table" />
      </Card>

      {/* Create Modal */}
      <Modal title="Create Loading Sheet" open={createOpen} onCancel={() => setCreateOpen(false)}
        onOk={handleCreate} confirmLoading={submitting} okText="Create Loading Sheet" width={600}>
        <Form form={form} layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item name="repOrderId" label="Rep Order (DRAFT only)" rules={[{ required: true, message: 'Select a rep order' }]}>
            <Select size="large" placeholder="Select a DRAFT rep order" showSearch optionFilterProp="label"
              options={repOrders.map((o: any) => ({
                label: `${o.orderNumber || 'RO-' + o.id} — ${o.repName || 'Unknown Rep'} — ${o.routeArea || ''} (${dayjs(o.orderDate).format('YYYY-MM-DD')})`,
                value: String(o.id),
              }))} />
          </Form.Item>
          <Form.Item name="driverId" label="Driver" rules={[{ required: true, message: 'Select a driver' }]}>
            <Select size="large" placeholder="Select driver" showSearch optionFilterProp="label"
              options={drivers.map((d: any) => ({ label: `${d.name} — ${d.vehicleNo || ''}`, value: String(d.id) }))} />
          </Form.Item>
          <Form.Item name="warehouseId" label="Source Warehouse (for reference)">
            <Select size="large" placeholder="Select source warehouse" allowClear
              options={warehouses.map((w: any) => ({ label: `${w.name} (${w.storeType})`, value: String(w.id) }))} />
          </Form.Item>
          <Form.Item name="loadingDate" label="Loading Date" rules={[{ required: true, message: 'Select loading date' }]}>
            <DatePicker size="large" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal title="Loading Sheet Details" open={detailOpen} onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>Close</Button>} width={800}>
        {selectedSheet && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="ID">#{selectedSheet.id}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={selectedSheet.status === 'CONFIRMED' ? 'green' : 'orange'}>{selectedSheet.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Rep">{selectedSheet.repName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Driver">{selectedSheet.driverName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Loading Date">{selectedSheet.loadingDate}</Descriptions.Item>
              <Descriptions.Item label="Rep Order">RO-{selectedSheet.repOrderId}</Descriptions.Item>
            </Descriptions>

            <Title level={5}>Items to Load</Title>
            <Table dataSource={selectedSheet.items || []} rowKey="id" pagination={false} size="small"
              columns={[
                { title: 'Product', dataIndex: 'productName', key: 'productName' },
                { title: 'SKU', dataIndex: 'productSku', key: 'productSku' },
                { title: 'Qty Loaded', dataIndex: 'quantityLoaded', key: 'quantityLoaded', align: 'right' },
                { title: 'Unit', dataIndex: 'unitType', key: 'unitType', render: (v: string) => <Tag>{v || 'EACH'}</Tag> },
              ]} />

            {selectedSheet.returns && selectedSheet.returns.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: '16px' }}>Expected Returns</Title>
                <Table dataSource={selectedSheet.returns} rowKey="id" pagination={false} size="small"
                  columns={[
                    { title: 'Product', dataIndex: 'productName', key: 'productName' },
                    { title: 'Qty', dataIndex: 'quantityReturned', key: 'quantityReturned', align: 'right' },
                    { title: 'Type', dataIndex: 'returnType', key: 'returnType' },
                  ]} />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
