import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Row, Space, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { driverApi } from '../../api/sales';
import type { Driver } from '../../types/sales';

const schema = z.object({
  name: z.string().min(1, 'common.required'),
  phone: z.string().optional(),
  licenseNo: z.string().optional(),
  vehicleNo: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function DriversPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [visible, setVisible] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await driverApi.list({ page: 0, size: 50 });
      setDrivers(result.content);
    } catch {
      message.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = useMemo(
    () => [
      { title: t('driver.name'), dataIndex: 'name', key: 'name' },
      { title: t('driver.phone'), dataIndex: 'phone', key: 'phone' },
      { title: t('driver.licenseNo'), dataIndex: 'licenseNo', key: 'licenseNo' },
      { title: t('driver.vehicleNo'), dataIndex: 'vehicleNo', key: 'vehicleNo' },
      {
        title: t('common.actions'),
        key: 'actions',
        render: (_: unknown, record: Driver) => (
          <Space>
            <Button type="link" onClick={() => { setEditDriver(record); setVisible(true); reset(record); }}>
              {t('common.edit')}
            </Button>
          </Space>
        ),
      },
    ],
    [t, reset]
  );

  const onSubmit = async (values: FormValues) => {
    try {
      if (editDriver) {
        await driverApi.update(editDriver.id, values);
        message.success(t('driver.updateSuccess'));
      } else {
        await driverApi.create(values);
        message.success(t('driver.createSuccess'));
      }
      setVisible(false);
      setEditDriver(null);
      reset();
      loadData();
    } catch {
      message.error('Failed to save driver');
    }
  };

  return (
    <>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>{t('driver.title')}</h2>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setVisible(true); setEditDriver(null); reset(); }}>
            {t('driver.create')}
          </Button>
        </Col>
      </Row>
      <Card>
        <Table<Driver> rowKey="id" loading={loading} dataSource={drivers} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
      <Modal title={editDriver ? t('driver.edit') : t('driver.create')} open={visible} onCancel={() => setVisible(false)} footer={null}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item label={t('driver.name')} validateStatus={errors.name ? 'error' : ''} help={errors.name?.message?.toString()}>
            <Input {...register('name')} />
          </Form.Item>
          <Form.Item label={t('driver.phone')}>
            <Input {...register('phone')} />
          </Form.Item>
          <Form.Item label={t('driver.licenseNo')}>
            <Input {...register('licenseNo')} />
          </Form.Item>
          <Form.Item label={t('driver.vehicleNo')}>
            <Input {...register('vehicleNo')} />
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
