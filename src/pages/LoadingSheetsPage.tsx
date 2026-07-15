/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Button, Card, Col, DatePicker, Form, Modal, Row, Select, Table, Tag, Tooltip, Typography, App, Space, Descriptions, Dropdown, Input,
} from 'antd';
import {
  PlusOutlined, CheckCircleOutlined, EyeOutlined, CloseCircleOutlined, DollarOutlined, StopOutlined, MoreOutlined, ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { loadingSheetApi, repOrderApi, driverApi } from '../api/sales';
import apiClient from '../api/client';
import { UnloadToShopModal } from '../features/inventory/components/UnloadToShopModal';
import { CancelOrderModal } from '../features/inventory/components/CancelOrderModal';

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
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [sheets, setSheets] = useState<LoadingSheetRow[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [unloadOpen, setUnloadOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<LoadingSheetRow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
  }, [message]);

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
  }, [loadData, message]);

  const handleCancel = useCallback(async (id: number) => {
    try {
      await loadingSheetApi.cancel(String(id));
      message.success('Loading sheet cancelled and rep order returned to DRAFT.');
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Failed to cancel';
      message.error(msg);
    }
  }, [loadData, message]);

  const filteredSheets = useMemo(() => {
    return sheets.filter(sheet => {
      if (statusFilter !== 'ALL' && sheet.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRep = sheet.repName?.toLowerCase().includes(q);
        const matchesDriver = sheet.driverName?.toLowerCase().includes(q);
        const matchesOrder = `RO-${sheet.repOrderId}`.toLowerCase().includes(q);
        const matchesId = String(sheet.id).includes(q);
        if (!matchesRep && !matchesDriver && !matchesOrder && !matchesId) return false;
      }
      return true;
    });
  }, [sheets, searchQuery, statusFilter]);

  const columns = useMemo(() => [
    {
      title: 'ID', dataIndex: 'id', key: 'id', width: 60,
      render: (val: number) => (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--color-text-secondary)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {val}
        </span>
      ),
    },
    {
      title: 'Rep Order', dataIndex: 'repOrderId', key: 'repOrderId', width: 100,
      render: (val: number) => (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          RO-{val}
        </span>
      ),
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
      render: (val: string) => val ? dayjs(val).format('DD MMM YYYY') : '—',
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 140,
      render: (status: string) => {
        const statusStyles: Record<string, { bg: string; color: string; border: string; icon: React.ReactNode }> = {
          CONFIRMED: {
            bg: 'var(--color-success-bg)',
            color: 'var(--color-success-text)',
            border: 'var(--color-success-border)',
            icon: <CheckCircleOutlined style={{ fontSize: '11px' }} />,
          },
          CANCELLED: {
            bg: 'var(--color-danger-bg)',
            color: 'var(--color-danger-text)',
            border: 'var(--color-danger-border)',
            icon: <CloseCircleOutlined style={{ fontSize: '11px' }} />,
          },
          DRAFT: {
            bg: 'var(--color-warning-bg)',
            color: 'var(--color-warning-text)',
            border: 'var(--color-warning-border)',
            icon: null,
          },
        };
        const s = statusStyles[status] || statusStyles.DRAFT;
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: '4px',
            lineHeight: '18px',
            background: s.bg,
            color: s.color,
            border: `1px solid ${s.border}`,
          }}>
            {s.icon}
            {status}
          </span>
        );
      },
    },
    {
      title: 'Items', key: 'itemCount',
      render: (_: unknown, record: LoadingSheetRow) => <Text>{record.items?.length || 0}</Text>,
    },
    {
      title: 'Actions', key: 'actions', align: 'right' as const, width: 80,
      render: (_: unknown, record: LoadingSheetRow) => {
        const items: any[] = [
          {
            key: 'view',
            label: 'View Details',
            icon: <EyeOutlined />,
            onClick: () => { setSelectedSheet(record); setDetailOpen(true); },
          },
        ];

        if (record.status === 'DRAFT') {
          items.push(
            { type: 'divider' },
            {
              key: 'confirm',
              label: 'Confirm & Transfer Stock',
              icon: <CheckCircleOutlined style={{ color: 'var(--color-success-text)' }} />,
              onClick: () => handleConfirm(record.id),
            },
            {
              key: 'cancel',
              label: 'Cancel Loading Sheet',
              icon: <CloseCircleOutlined />,
              danger: true,
              onClick: () => {
                Modal.confirm({
                  title: 'Cancel this DRAFT loading sheet?',
                  onOk: () => handleCancel(record.id),
                  okText: 'Yes',
                  cancelText: 'No'
                });
              },
            },
          );
        }

        if (record.status === 'CONFIRMED') {
          items.push(
            { type: 'divider' },
            {
              key: 'unload',
              label: 'Unload to Shop',
              icon: <DollarOutlined style={{ color: 'var(--color-primary)' }} />,
              onClick: () => { setSelectedSheet(record); setUnloadOpen(true); },
            },
            {
              key: 'cancel-order',
              label: 'Cancel Order',
              icon: <StopOutlined />,
              danger: true,
              onClick: () => { setSelectedSheet(record); setCancelOpen(true); },
            },
          );
        }

        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: '16px' }} />}
              aria-label={`Actions for loading sheet ${record.id}`}
              style={{
                width: 36, height: 36,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}
            />
          </Dropdown>
        );
      },
    },
  ], [handleConfirm, handleCancel]);

  return (
    <div style={{ padding: 'var(--space-8)' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.2,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}>
            Loading Sheets
          </h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
            style={{ height: '40px', paddingInline: '20px' }}
          >
            New Loading Sheet
          </Button>
        </div>
      </div>

      {/* ─── TOOLBAR ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
        paddingBottom: 'var(--space-4)',
        borderBottom: '1px solid var(--color-border-default)',
      }}>
        <div style={{ flex: 1, maxWidth: '448px' }}>
          <Input.Search
            placeholder="Search by rep, driver, or order number"
            aria-label="Search loading sheets"
            allowClear
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%' }}
            size="middle"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Select
            defaultValue="ALL"
            size="middle"
            style={{ width: 160 }}
            onChange={setStatusFilter}
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Confirmed', value: 'CONFIRMED' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={loadData} size="middle">
            Refresh
          </Button>
        </div>
      </div>

      <Card 
        style={{ 
          borderRadius: 'var(--radius-lg)', 
          boxShadow: 'var(--shadow-none)', 
          border: '1px solid var(--color-border-default)',
          overflow: 'hidden'
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table rowKey="id" loading={loading} dataSource={filteredSheets} columns={columns} pagination={{ pageSize: 10, className: 'px-4 py-3 m-0 border-t border-slate-100' }} className="spiceflow-table" />
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

      <UnloadToShopModal
        visible={unloadOpen}
        loadingSheet={selectedSheet as any}
        onClose={() => setUnloadOpen(false)}
        onSuccess={loadData}
      />

      <CancelOrderModal
        visible={cancelOpen}
        loadingSheet={selectedSheet as any}
        onClose={() => setCancelOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
