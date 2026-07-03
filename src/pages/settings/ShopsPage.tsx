import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { repApi, shopApi } from '../../api/sales';
import type { Rep, Shop } from '../../types/sales';

const schema = z.object({
  name: z.string().min(1, 'common.required'),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  repId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ShopsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [visible, setVisible] = useState(false);
  const [editShop, setEditShop] = useState<Shop | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [shopResult, repResult] = await Promise.all([
        shopApi.list({ page: 0, size: 50 }),
        repApi.list({ page: 0, size: 50 }),
      ]);
      setShops(shopResult.content);
      setReps(repResult.content);
    } catch {
      message.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = useMemo(
    () => [
      { title: t('shop.name'), dataIndex: 'name', key: 'name' },
      { title: t('shop.ownerName'), dataIndex: 'ownerName', key: 'ownerName' },
      { title: t('shop.phone'), dataIndex: 'phone', key: 'phone' },
      { title: t('shop.address'), dataIndex: 'address', key: 'address' },
      { title: t('shop.rep'), dataIndex: ['rep', 'name'], key: 'rep' },
      { title: t('shop.outstandingLoan'), dataIndex: 'outstandingLoan', key: 'outstandingLoan' },
      {
        title: t('common.actions'),
        key: 'actions',
        render: (_: unknown, record: Shop) => (
          <Space>
            <Button type="link" onClick={() => { setEditShop(record); setVisible(true); reset(record); }}>
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
      if (editShop) {
        await shopApi.update(editShop.id, values);
        message.success(t('shop.updateSuccess'));
      } else {
        await shopApi.create(values);
        message.success(t('shop.createSuccess'));
      }
      setVisible(false);
      setEditShop(null);
      reset();
      loadData();
    } catch {
      message.error('Failed to save shop');
    }
  };

  return (
    <>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>{t('shop.title')}</h2>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setVisible(true); setEditShop(null); reset(); }}>
            {t('shop.create')}
          </Button>
        </Col>
      </Row>
      <Card>
        <Table<Shop> rowKey="id" loading={loading} dataSource={shops} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
      <Modal title={editShop ? t('shop.edit') : t('shop.create')} open={visible} onCancel={() => setVisible(false)} footer={null}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item label={t('shop.name')} validateStatus={errors.name ? 'error' : ''} help={errors.name?.message?.toString()}>
            <Input {...register('name')} />
          </Form.Item>
          <Form.Item label={t('shop.ownerName')}>
            <Input {...register('ownerName')} />
          </Form.Item>
          <Form.Item label={t('shop.phone')}>
            <Input {...register('phone')} />
          </Form.Item>
          <Form.Item label={t('shop.address')}>
            <Input.TextArea rows={3} {...register('address')} />
          </Form.Item>
          <Form.Item label={t('shop.rep')}>
            <Select {...(register('repId') as unknown as Record<string, unknown>)} options={reps.map((rep) => ({ value: rep.id, label: rep.name }))} />
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
