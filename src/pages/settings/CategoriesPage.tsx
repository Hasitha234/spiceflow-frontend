import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Row, Space, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { categoryApi } from '../../api/inventory';
import type { ProductCategory } from '../../types/inventory';

const schema = z.object({
  name: z.string().min(1, 'common.required'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CategoriesPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [visible, setVisible] = useState(false);
  const [editCategory, setEditCategory] = useState<ProductCategory | null>(null);

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await categoryApi.list({ page: 0, size: 100 });
      setCategories(result.content);
    } catch {
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await categoryApi.delete(id);
      message.success(t('category.deleteSuccess'));
      loadData();
    } catch {
      message.error('Failed to delete category');
    }
  };

  const columns = useMemo(
    () => [
      { title: t('category.name'), dataIndex: 'name', key: 'name' },
      { title: t('category.description'), dataIndex: 'description', key: 'description' },
      {
        title: t('common.actions'),
        key: 'actions',
        render: (_: unknown, record: ProductCategory) => (
          <Space>
            <Button
              type="link"
              onClick={() => {
                setEditCategory(record);
                setVisible(true);
                reset({
                  name: record.name,
                  description: record.description || '',
                });
              }}
            >
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

  const onSubmit = async (values: FormValues) => {
    try {
      if (editCategory) {
        await categoryApi.update(editCategory.id, values);
        message.success(t('category.updateSuccess'));
      } else {
        await categoryApi.create(values);
        message.success(t('category.createSuccess'));
      }
      setVisible(false);
      setEditCategory(null);
      reset({ name: '', description: '' });
      loadData();
    } catch {
      message.error('Failed to save category');
    }
  };

  return (
    <>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>{t('category.title')}</h2>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setVisible(true);
              setEditCategory(null);
              reset({ name: '', description: '' });
            }}
          >
            {t('category.create')}
          </Button>
        </Col>
      </Row>
      <Card>
        <Table<ProductCategory> rowKey="id" loading={loading} dataSource={categories} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
      <Modal title={editCategory ? t('category.edit') : t('category.create')} open={visible} onCancel={() => setVisible(false)} footer={null}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item label={t('category.name')} validateStatus={errors.name ? 'error' : ''} help={errors.name?.message?.toString()} required>
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input {...field} id="name" placeholder="e.g. Ground Spices" />}
            />
          </Form.Item>
          <Form.Item label={t('category.description')} validateStatus={errors.description ? 'error' : ''} help={errors.description?.message?.toString()}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => <Input.TextArea {...field} id="description" rows={3} placeholder="Optional description..." />}
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
