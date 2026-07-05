import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Row, Space, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
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

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone: '',
      licenseNo: '',
      vehicleNo: '',
    },
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
            <Button
              type="link"
              onClick={() => {
                setEditDriver(record);
                setVisible(true);
                reset({
                  name: record.name,
                  phone: record.phone || '',
                  licenseNo: record.licenseNo || '',
                  vehicleNo: record.vehicleNo || '',
                });
              }}
            >
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
      reset({ name: '', phone: '', licenseNo: '', vehicleNo: '' });
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setVisible(true);
              setEditDriver(null);
              reset({ name: '', phone: '', licenseNo: '', vehicleNo: '' });
            }}
          >
            {t('driver.create')}
          </Button>
        </Col>
      </Row>
      <Card>
        <Table<Driver> rowKey="id" loading={loading} dataSource={drivers} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
      <Modal title={editDriver ? t('driver.edit') : t('driver.create')} open={visible} onCancel={() => setVisible(false)} footer={null}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item label={t('driver.name')} validateStatus={errors.name ? 'error' : ''} help={errors.name?.message?.toString()} required>
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input {...field} id="name" />}
            />
          </Form.Item>
          <Form.Item label={t('driver.phone')} validateStatus={errors.phone ? 'error' : ''} help={errors.phone?.message?.toString()}>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => <Input {...field} id="phone" />}
            />
          </Form.Item>
          <Form.Item label={t('driver.licenseNo')} validateStatus={errors.licenseNo ? 'error' : ''} help={errors.licenseNo?.message?.toString()}>
            <Controller
              name="licenseNo"
              control={control}
              render={({ field }) => <Input {...field} id="licenseNo" />}
            />
          </Form.Item>
          <Form.Item label={t('driver.vehicleNo')} validateStatus={errors.vehicleNo ? 'error' : ''} help={errors.vehicleNo?.message?.toString()}>
            <Controller
              name="vehicleNo"
              control={control}
              render={({ field }) => <Input {...field} id="vehicleNo" />}
            />
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
