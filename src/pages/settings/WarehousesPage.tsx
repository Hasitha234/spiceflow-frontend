import { useEffect, useMemo, useState, useCallback } from 'react';
import { Button, Card, Col, Form, Input, Row, Select, Space, Table, message, ConfigProvider, Typography, Statistic, Tag, Popconfirm, Tooltip, Drawer, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, BankOutlined, CarOutlined, AppstoreOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { warehouseApi } from '../../api/inventory';
import type { Warehouse } from '../../types/inventory';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/useResponsive';

const { Title, Text } = Typography;

const schema = z.object({
  name: z.string().min(1, 'common.required'),
  storeType: z.enum(['MAIN', 'VEHICLE', 'CUSTOM']),
  location: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function WarehousesPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [visible, setVisible] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);

  const storeTypeOptions = useMemo(
    () => [
      { label: t('warehouse.main'), value: 'MAIN' },
      { label: t('warehouse.vehicle'), value: 'VEHICLE' },
      { label: t('warehouse.custom'), value: 'CUSTOM' },
    ],
    [t]
  );

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      storeType: 'MAIN',
      location: '',
    },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await warehouseApi.list({ page, size });
      setWarehouses(result.content);
      setTotal(result.totalElements || 0);
    } catch {
      message.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(w => {
      const matchesSearch = w.name.toLowerCase().includes(searchText.toLowerCase()) || (w.location || '').toLowerCase().includes(searchText.toLowerCase());
      const matchesType = filterType ? w.storeType === filterType : true;
      return matchesSearch && matchesType;
    });
  }, [warehouses, searchText, filterType]);

  const stats = useMemo(() => {
    return {
      total: warehouses.length,
      main: warehouses.filter(w => w.storeType === 'MAIN').length,
      vehicle: warehouses.filter(w => w.storeType === 'VEHICLE').length,
    };
  }, [warehouses]);

  const columns = useMemo(
    () => [
      { 
        title: <span style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: '#64748b' }}>{t('warehouse.name')}</span>, 
        dataIndex: 'name', 
        key: 'name',
        render: (text: string) => <Text style={{ fontWeight: 500, color: '#334155' }}>{text}</Text>
      },
      {
        title: <span style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: '#64748b' }}>{t('warehouse.storeType')}</span>,
        dataIndex: 'storeType',
        key: 'storeType',
        render: (type: string) => {
          if (type === 'MAIN') return <Tag icon={<BankOutlined />} color="green">{t('warehouse.main')}</Tag>;
          if (type === 'VEHICLE') return <Tag icon={<CarOutlined />} color="blue">{t('warehouse.vehicle')}</Tag>;
          if (type === 'CUSTOM') return <Tag icon={<AppstoreOutlined />} color="orange">{t('warehouse.custom')}</Tag>;
          return <Tag>{type}</Tag>;
        },
      },
      { 
        title: <span style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: '#64748b' }}>{t('warehouse.location')}</span>, 
        dataIndex: 'location', 
        key: 'location',
        render: (text: string) => text ? (
          <Space size={4}>
            <EnvironmentOutlined style={{ color: '#94a3b8' }} />
            <Text style={{ color: '#64748b' }}>{text}</Text>
          </Space>
        ) : <Text style={{ color: '#94a3b8', fontStyle: 'italic' }}>No location</Text>
      },
      {
        title: <span style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: '#64748b' }}>{t('common.actions')}</span>,
        key: 'actions',
        align: 'right' as const,
        render: (_: unknown, record: Warehouse) => (
          <Space size="middle">
            <Tooltip title={t('common.edit')}>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditWarehouse(record);
                  setVisible(true);
                  reset({
                    name: record.name,
                    storeType: record.storeType,
                    location: record.location || '',
                  });
                }}
              />
            </Tooltip>
            <Tooltip title={t('common.delete')}>
              <Popconfirm
                title={t('warehouse.deleteConfirm')}
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
                placement="topLeft"
              >
                <Button danger type="text" icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, reset]
  );

  const handleDelete = async (id: string) => {
    try {
      await warehouseApi.delete(id);
      message.success(t('warehouse.deleteSuccess'));
      loadData();
    } catch {
      message.error('Failed to delete warehouse');
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (editWarehouse) {
        await warehouseApi.update(editWarehouse.id, values);
        message.success(t('warehouse.updateSuccess'));
      } else {
        await warehouseApi.create(values);
        message.success(t('warehouse.createSuccess'));
      }
      setVisible(false);
      setEditWarehouse(null);
      reset({ name: '', storeType: 'MAIN', location: '' });
      loadData();
    } catch {
      message.error('Failed to save warehouse');
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#059669',
          fontFamily: 'var(--font-sans, sans-serif)',
          colorText: '#334155',
          colorTextSecondary: '#64748b',
          colorBorder: '#e2e8f0',
          borderRadius: 6,
          controlHeight: 36,
        },
      }}
    >
      <div style={{ padding: '24px', minHeight: '100vh', boxSizing: 'border-box' }}>
        
        {/* HEADER AREA */}
        <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={1} style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              {t('warehouse.title')}
            </Title>
            <Text style={{ fontSize: '15px', marginTop: '4px', display: 'block', color: '#64748b' }}>
              Manage all your inventory locations and tracking areas.
            </Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setVisible(true);
                setEditWarehouse(null);
                reset({ name: '', storeType: 'MAIN', location: '' });
              }}
              style={{ fontWeight: 500 }}
            >
              {t('warehouse.create')}
            </Button>
          </Col>
        </Row>

        {/* STATS CARDS */}
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card variant="borderless" style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)' }}>
                <Statistic title={<span style={{ color: '#64748b' }}>Total Warehouses</span>} value={stats.total} prefix={<BankOutlined style={{ color: '#64748b', fontSize: '24px' }} />} styles={{ content: { fontWeight: 600, color: '#0f172a' } }} />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={8}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <Card variant="borderless" style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)' }}>
                <Statistic title={<span style={{ color: '#64748b' }}>Main Storage</span>} value={stats.main} prefix={<BankOutlined style={{ color: '#64748b', fontSize: '24px' }} />} styles={{ content: { fontWeight: 600, color: '#0f172a' } }} />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={8}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <Card variant="borderless" style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)' }}>
                <Statistic title={<span style={{ color: '#64748b' }}>Vehicles</span>} value={stats.vehicle} prefix={<CarOutlined style={{ color: '#64748b', fontSize: '24px' }} />} styles={{ content: { fontWeight: 600, color: '#0f172a' } }} />
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* SEARCH AND TABLE CARD */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <Card 
            variant="borderless" 
            style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)' }}
            styles={{ body: { padding: '24px' } }}
          >
            <Row justify="space-between" style={{ marginBottom: '16px' }} gutter={[16, 16]}>
              <Col xs={24} sm={16} md={12} lg={8}>
                <Input.Search
                  placeholder="Search warehouses by name or location..."
                  allowClear
                  onSearch={setSearchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={8} md={8} lg={6}>
                <Select
                  placeholder="Filter by Type"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={setFilterType}
                  options={[
                    { label: 'All Types', value: null },
                    ...storeTypeOptions
                  ]}
                />
              </Col>
            </Row>

            <Table<Warehouse> 
              rowKey="id" 
              loading={loading} 
              dataSource={filteredWarehouses} 
              columns={columns} 
              pagination={{
                current: page + 1,
                pageSize: size,
                total: total,
                onChange: (p, s) => {
                  setPage(p - 1);
                  setSize(s);
                },
                showSizeChanger: true
              }} 
              locale={{
                emptyText: (
                  <Empty 
                    description={<span style={{ color: '#64748b' }}>No warehouses found. Create one to get started!</span>} 
                  >
                    <Button type="primary" onClick={() => setVisible(true)}>
                      + Create Warehouse
                    </Button>
                  </Empty>
                )
              }}
            />
          </Card>
        </motion.div>

        {/* FORM DRAWER */}
        <Drawer 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editWarehouse ? <EditOutlined style={{ color: '#059669' }} /> : <PlusOutlined style={{ color: '#059669' }} />}
              <span style={{ fontWeight: 600, fontSize: '18px', color: '#0f172a' }}>
                {editWarehouse ? t('warehouse.edit') : t('warehouse.create')}
              </span>
            </div>
          } 
          width={isMobile ? '100vw' : 480}
          placement={isMobile ? 'bottom' : 'right'} rootClassName={isMobile ? 'sf-full-height-drawer' : ''}
          open={visible} 
          onClose={() => setVisible(false)}
          destroyOnHidden
          closeIcon={null}
          extra={<Button type="text" icon={<CloseOutlined />} onClick={() => setVisible(false)} style={{ color: '#64748b' }} />}
          footer={
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '16px' }}>
              <Button onClick={() => setVisible(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="primary" htmlType="submit" form="warehouse-form" loading={isSubmitting} style={{ fontWeight: 500 }}>
                {t('common.save')}
              </Button>
            </div>
          }
          styles={{ footer: { borderTop: '1px solid #e2e8f0', background: '#fff' } }}
        >
          <Form id="warehouse-form" layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item 
              label={<span style={{ fontWeight: 500 }}>{t('warehouse.name')}</span>} 
              validateStatus={errors.name ? 'error' : ''} 
              help={errors.name?.message?.toString()} 
              required
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input {...field} id="name" placeholder="e.g. Central Hub, Vehicle #42" />}
              />
            </Form.Item>
            
            <Form.Item 
              label={<span style={{ fontWeight: 500 }}>{t('warehouse.storeType')}</span>} 
              validateStatus={errors.storeType ? 'error' : ''} 
              help={errors.storeType?.message?.toString()} 
              required
            >
              <Controller
                name="storeType"
                control={control}
                render={({ field }) => (
                  <Select 
                    {...field} 
                    id="storeType" 
                    options={storeTypeOptions} 
                    placeholder="Select warehouse type"
                  />
                )}
              />
            </Form.Item>
            
            <Form.Item 
              label={<span style={{ fontWeight: 500 }}>{t('warehouse.location')}</span>} 
              validateStatus={errors.location ? 'error' : ''} 
              help={errors.location?.message?.toString()}
            >
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <Input 
                    {...field} 
                    id="location" 
                    placeholder="e.g. 123 Main St, New York" 
                    prefix={<EnvironmentOutlined style={{ color: 'var(--text-muted)' }} />}
                  />
                )}
              />
            </Form.Item>
          </Form>
        </Drawer>
      </div>
    </ConfigProvider>
  );
}


