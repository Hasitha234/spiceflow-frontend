import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { warehouseApi } from '../../api/inventory';
import type { Warehouse } from '../../types/inventory';

const schema = z.object({
  name: z.string().min(1, 'common.required'),
  storeType: z.enum(['MAIN', 'VEHICLE', 'CUSTOM']),
  location: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const storeTypeOptions = [
  { label: 'Main Store', value: 'MAIN' },
  { label: 'Vehicle', value: 'VEHICLE' },
  { label: 'Second Store', value: 'CUSTOM' },
];

export function WarehousesPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [visible, setVisible] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
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

  const columns = useMemo(
    () => [
      { title: t('warehouse.name'), dataIndex: 'name', key: 'name' },
      { title: t('warehouse.storeType'), dataIndex: 'storeType', key: 'storeType' },
      { title: t('warehouse.location'), dataIndex: 'location', key: 'location' },
      {
        title: t('common.actions'),
        key: 'actions',
        render: (_: unknown, record: Warehouse) => (
          <Space>
            <Button type="link" onClick={() => { setEditWarehouse(record); setVisible(true); reset(record); }}>
              {t('common.edit')}
            </Button>
            <Button danger type="link" onClick={() => handleDelete(record.id)}>
              {t('common.delete')}
            </Button>
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
      reset();
      loadData();
    } catch {
      message.error('Failed to save warehouse');
    }
  };

  return (
    <>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>{t('warehouse.title')}</h2>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setVisible(true); setEditWarehouse(null); reset(); }}>
            {t('warehouse.create')}
          </Button>
        </Col>
      </Row>
      <Card>
        <Table<Warehouse> rowKey="id" loading={loading} dataSource={warehouses} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
      <Modal title={editWarehouse ? t('warehouse.edit') : t('warehouse.create')} open={visible} onCancel={() => setVisible(false)} footer={null}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item label={t('warehouse.name')} validateStatus={errors.name ? 'error' : ''} help={errors.name?.message?.toString()}>
            <Input {...register('name')} />
          </Form.Item>
          <Form.Item label={t('warehouse.storeType')} validateStatus={errors.storeType ? 'error' : ''} help={errors.storeType?.message?.toString()}>
            <Select {...(register('storeType') as unknown as Record<string, unknown>)} options={storeTypeOptions} />
          </Form.Item>
          <Form.Item label={t('warehouse.location')}>
            <Input {...register('location')} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                {t('common.save')}
              </Button>
              <Button onClick={() => setVisible(false)}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
