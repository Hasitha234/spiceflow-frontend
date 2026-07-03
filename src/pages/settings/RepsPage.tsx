import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Row, Space, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { repApi } from '../../api/sales';
import type { Rep } from '../../types/sales';

const schema = z.object({
  name: z.string().min(1, 'common.required'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  route: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function RepsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [reps, setReps] = useState<Rep[]>([]);
  const [visible, setVisible] = useState(false);
  const [editRep, setEditRep] = useState<Rep | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await repApi.list({ page: 0, size: 50 });
      setReps(result.content);
    } catch {
      message.error('Failed to load reps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = useMemo(
    () => [
      { title: t('rep.name'), dataIndex: 'name', key: 'name' },
      { title: t('rep.phone'), dataIndex: 'phone', key: 'phone' },
      { title: t('rep.email'), dataIndex: 'email', key: 'email' },
      { title: t('rep.route'), dataIndex: 'route', key: 'route' },
      {
        title: t('common.actions'),
        key: 'actions',
        render: (_: unknown, record: Rep) => (
          <Space>
            <Button type="link" onClick={() => { setEditRep(record); setVisible(true); reset(record); }}>
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
      if (editRep) {
        await repApi.update(editRep.id, values);
        message.success(t('rep.updateSuccess'));
      } else {
        await repApi.create(values);
        message.success(t('rep.createSuccess'));
      }
      setVisible(false);
      setEditRep(null);
      reset();
      loadData();
    } catch {
      message.error('Failed to save rep');
    }
  };

  return (
    <>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>{t('rep.title')}</h2>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setVisible(true); setEditRep(null); reset(); }}>
            {t('rep.create')}
          </Button>
        </Col>
      </Row>
      <Card>
        <Table<Rep> rowKey="id" loading={loading} dataSource={reps} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
      <Modal title={editRep ? t('rep.edit') : t('rep.create')} open={visible} onCancel={() => setVisible(false)} footer={null}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item label={t('rep.name')} validateStatus={errors.name ? 'error' : ''} help={errors.name?.message?.toString()}>
            <Input {...register('name')} />
          </Form.Item>
          <Form.Item label={t('rep.phone')}>
            <Input {...register('phone')} />
          </Form.Item>
          <Form.Item label={t('rep.email')} validateStatus={errors.email ? 'error' : ''} help={errors.email?.message?.toString()}>
            <Input {...register('email')} />
          </Form.Item>
          <Form.Item label={t('rep.route')}>
            <Input {...register('route')} />
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
