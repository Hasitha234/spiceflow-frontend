import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, Row, Select, Space, Table, message, ConfigProvider, Typography, Statistic, Tag, Popconfirm, Tooltip, Drawer, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, BankOutlined, CarOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { warehouseApi } from '../../api/inventory';
import type { Warehouse } from '../../types/inventory';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

const schema = z.object({
  name: z.string().min(1, 'common.required'),
  storeType: z.enum(['MAIN', 'VEHICLE', 'CUSTOM']),
  location: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function WarehousesPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [visible, setVisible] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

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

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await warehouseApi.list({ page: 0, size: 50 });
      setWarehouses(result.content);
    } catch {
      message.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
        title: t('warehouse.name'), 
        dataIndex: 'name', 
        key: 'name',
        render: (text: string) => <Text style={{ fontWeight: 500 }}>{text}</Text>
      },
      {
        title: t('warehouse.storeType'),
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
        title: t('warehouse.location'), 
        dataIndex: 'location', 
        key: 'location',
        render: (text: string) => text ? (
          <Space size={4}>
            <EnvironmentOutlined style={{ color: 'var(--text-muted)' }} />
            <Text type="secondary">{text}</Text>
          </Space>
        ) : <Text type="secondary" italic>No location</Text>
      },
      {
        title: t('common.actions'),
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
          colorPrimary: '#0F9D6C',
          fontFamily: 'var(--font-sans, sans-serif)',
        },
      }}
    >
      <div style={{ padding: '24px', minHeight: '100vh', boxSizing: 'border-box' }}>
        
        {/* HEADER AREA */}
        <Row justify="space-between" align="middle" style={{ marginBottom: '32px' }}>
          <Col>
            <Title level={1} style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              {t('warehouse.title')}
            </Title>
            <Text type="secondary" style={{ fontSize: '15px', marginTop: '4px', display: 'block' }}>
              Manage all your inventory locations and tracking areas.
            </Text>
          </Col>
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => {
                setVisible(true);
                setEditWarehouse(null);
                reset({ name: '', storeType: 'MAIN', location: '' });
              }}
              style={{ fontWeight: 500, borderRadius: '6px' }}
            >
              {t('warehouse.create')}
            </Button>
          </Col>
        </Row>

        {/* STATS CARDS */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <Statistic title="Total Warehouses" value={stats.total} prefix={<BankOutlined style={{ color: '#0F9D6C' }} />} valueStyle={{ fontWeight: 600 }} />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={8}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <Statistic title="Main Storage" value={stats.main} prefix={<BankOutlined style={{ color: '#52c41a' }} />} valueStyle={{ fontWeight: 600 }} />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={8}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <Statistic title="Vehicles" value={stats.vehicle} prefix={<CarOutlined style={{ color: '#1890ff' }} />} valueStyle={{ fontWeight: 600 }} />
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* SEARCH AND TABLE CARD */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <Card 
            bordered={false} 
            style={{ borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}
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
                  size="large"
                />
              </Col>
              <Col xs={24} sm={8} md={8} lg={6}>
                <Select
                  placeholder="Filter by Type"
                  allowClear
                  style={{ width: '100%' }}
                  size="large"
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
              pagination={{ pageSize: 10, showSizeChanger: true }} 
              locale={{
                emptyText: <Empty description="No warehouses found. Create one to get started!" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              }}
            />
          </Card>
        </motion.div>

        {/* FORM DRAWER */}
        <Drawer 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editWarehouse ? <EditOutlined style={{ color: '#0F9D6C' }} /> : <PlusOutlined style={{ color: '#0F9D6C' }} />}
              <span style={{ fontWeight: 600, fontSize: '18px' }}>
                {editWarehouse ? t('warehouse.edit') : t('warehouse.create')}
              </span>
            </div>
          } 
          width={480}
          open={visible} 
          onClose={() => setVisible(false)}
          destroyOnClose
        >
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item 
              label={<span style={{ fontWeight: 500 }}>{t('warehouse.name')}</span>} 
              validateStatus={errors.name ? 'error' : ''} 
              help={errors.name?.message?.toString()} 
              required
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input {...field} id="name" size="large" placeholder="e.g. Central Hub, Vehicle #42" />}
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
                    size="large" 
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
                    size="large" 
                    placeholder="e.g. 123 Main St, New York" 
                    prefix={<EnvironmentOutlined style={{ color: 'var(--text-muted)' }} />}
                  />
                )}
              />
            </Form.Item>
            
            <div style={{ marginTop: '40px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button size="large" onClick={() => setVisible(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="primary" size="large" htmlType="submit" loading={isSubmitting} style={{ fontWeight: 500 }}>
                {t('common.save')}
              </Button>
            </div>
          </Form>
        </Drawer>
      </div>
    </ConfigProvider>
  );
}

