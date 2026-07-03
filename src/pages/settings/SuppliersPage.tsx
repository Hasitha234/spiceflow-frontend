import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Row, Space, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supplierApi } from '../../api/inventory';
import type { Supplier } from '../../types/inventory';

const schema = z.object({
  name: z.string().min(1, 'common.required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function SuppliersPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [visible, setVisible] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await supplierApi.list({ page: 0, size: 50 });
      setSuppliers(result.content);
    } catch {
      message.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = useMemo(
    () => [
      { title: t('supplier.name'), dataIndex: 'name', key: 'name' },
      { title: t('supplier.contactPerson'), dataIndex: 'contactPerson', key: 'contactPerson' },
      { title: t('supplier.phone'), dataIndex: 'phone', key: 'phone' },
      { title: t('supplier.email'), dataIndex: 'email', key: 'email' },
      { title: t('supplier.address'), dataIndex: 'address', key: 'address' },
      {
        title: t('common.actions'),
        key: 'actions',
        render: (_: unknown, record: Supplier) => (
          <Space>
            <Button type="link" onClick={() => { setEditSupplier(record); setVisible(true); reset(record); }}>
              {t('common.edit')}
            </Button>
            <Button danger type="link" onClick={() => handleDelete(record.id)}>
              {t('common.delete')}
            </Button>
          </Space>
        ),
      },
    ],
    [t, reset]
  );

  const handleDelete = async (id: string) => {
    try {
      await supplierApi.delete(id);
      message.success(t('supplier.deleteSuccess'));
      loadData();
    } catch {
      message.error('Failed to delete supplier');
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (editSupplier) {
        await supplierApi.update(editSupplier.id, values);
        message.success(t('supplier.updateSuccess'));
      } else {
        await supplierApi.create(values);
        message.success(t('supplier.createSuccess'));
      }
      setVisible(false);
      setEditSupplier(null);
      reset();
      loadData();
    } catch {
      message.error('Failed to save supplier');
    }
  };

  return (
    <>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>{t('supplier.title')}</h2>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setVisible(true); setEditSupplier(null); reset(); }}>
            {t('supplier.create')}
          </Button>
        </Col>
      </Row>
      <Card>
        <Table<Supplier> rowKey="id" loading={loading} dataSource={suppliers} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
      <Modal title={editSupplier ? t('supplier.edit') : t('supplier.create')} open={visible} onCancel={() => setVisible(false)} footer={null}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item label={t('supplier.name')} validateStatus={errors.name ? 'error' : ''} help={errors.name?.message?.toString()}>
            <Input {...register('name')} />
          </Form.Item>
          <Form.Item label={t('supplier.contactPerson')}>
            <Input {...register('contactPerson')} />
          </Form.Item>
          <Form.Item label={t('supplier.phone')}>
            <Input {...register('phone')} />
          </Form.Item>
          <Form.Item label={t('supplier.email')} validateStatus={errors.email ? 'error' : ''} help={errors.email?.message?.toString()}>
            <Input {...register('email')} />
          </Form.Item>
          <Form.Item label={t('supplier.address')}>
            <Input.TextArea rows={3} {...register('address')} />
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
