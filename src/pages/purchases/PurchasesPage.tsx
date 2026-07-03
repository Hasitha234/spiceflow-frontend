import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { purchaseApi } from '../../api/sales';
import { supplierApi, warehouseApi } from '../../api/inventory';
import type { Supplier, Warehouse } from '../../types/inventory';
import type { Purchase } from '../../types/sales';

const schema = z.object({
  invoiceNo: z.string().min(1, 'common.required'),
  supplierId: z.string().min(1, 'common.required'),
  purchaseDate: z.string().min(1, 'common.required'),
  notes: z.string().optional(),
  lineItems: z.array(
    z.object({
      productId: z.string().min(1, 'common.required'),
      quantity: z.number().int().positive('common.required'),
      unitCost: z.number().min(0),
      warehouseId: z.string().optional(),
    })
  ),
});

type FormValues = z.infer<typeof schema>;

const emptyLineItem = { productId: '', quantity: 1, unitCost: 0, warehouseId: '' };

export function PurchasesPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset, register } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      purchaseDate: new Date().toISOString().slice(0, 10),
      lineItems: [emptyLineItem],
    },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [purchaseRes, supplierRes, warehouseRes] = await Promise.all([
        purchaseApi.list({ page: 0, size: 50 }),
        supplierApi.list({ page: 0, size: 50 }),
        warehouseApi.list({ page: 0, size: 50 }),
      ]);
      setPurchases(purchaseRes.content);
      setSuppliers(supplierRes.content);
      setWarehouses(warehouseRes.content);
    } catch {
      message.error('Failed to load purchase data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = useMemo(
    () => [
      { title: t('purchase.invoiceNo'), dataIndex: 'invoiceNo', key: 'invoiceNo' },
      { title: t('purchase.supplier'), dataIndex: ['supplier', 'name'], key: 'supplier' },
      { title: t('purchase.purchaseDate'), dataIndex: 'purchaseDate', key: 'purchaseDate' },
      { title: t('purchase.status'), dataIndex: 'status', key: 'status' },
      { title: t('purchase.totalAmount'), dataIndex: 'totalAmount', key: 'totalAmount' },
      {
        title: t('common.actions'),
        key: 'actions',
        render: (_: unknown, record: Purchase) => (
          <Space>
            <Button type="link" onClick={() => { setSelectedPurchase(record); setVisible(true); reset(record as never); }}>
              {t('common.view')}
            </Button>
            {record.status === 'DRAFT' && (
              <Button type="link" onClick={() => handleConfirm(record.id)}>
                {t('purchase.confirmTitle')}
              </Button>
            )}
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, reset]
  );

  const handleConfirm = async (id: string) => {
    try {
      await purchaseApi.confirm(id);
      message.success(t('purchase.confirmSuccess'));
      loadData();
    } catch {
      message.error('Failed to confirm purchase');
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await purchaseApi.create(values);
      message.success(t('purchase.createSuccess'));
      setVisible(false);
      reset();
      loadData();
    } catch {
      message.error('Failed to create purchase');
    }
  };

  return (
    <>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>{t('purchase.title')}</h2>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setVisible(true);
              setSelectedPurchase(null);
              reset({
                invoiceNo: '',
                supplierId: '',
                purchaseDate: new Date().toISOString().slice(0, 10),
                notes: '',
                lineItems: [emptyLineItem],
              });
            }}
          >
            {t('purchase.create')}
          </Button>
        </Col>
      </Row>
      <Card>
        <Table<Purchase> rowKey="id" loading={loading} dataSource={purchases} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={selectedPurchase ? t('purchase.edit') : t('purchase.create')}
        open={visible}
        onCancel={() => setVisible(false)}
        width={900}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={t('purchase.invoiceNo')} validateStatus={errors.invoiceNo ? 'error' : ''} help={errors.invoiceNo?.message?.toString()}>
                <Input {...register('invoiceNo')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('purchase.supplier')} validateStatus={errors.supplierId ? 'error' : ''} help={errors.supplierId?.message?.toString()}>
                <Controller
                  name="supplierId"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} options={suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))} />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={t('purchase.purchaseDate')} validateStatus={errors.purchaseDate ? 'error' : ''} help={errors.purchaseDate?.message?.toString()}>
                <Input type="date" {...register('purchaseDate')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('purchase.warehouse')}>
                <Controller
                  name="lineItems.0.warehouseId"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} options={warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))} />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label={t('purchase.notes')}>
            <Input.TextArea rows={3} {...register('notes')} />
          </Form.Item>
          <Card title={t('purchase.lineItems')} style={{ marginBottom: 16 }}>
            <p>Line item creation is supported through backend schema; implement add/remove in the next phase.</p>
          </Card>
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
