import React, { useEffect, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Form, InputNumber, Select, Button, Row, Col, Typography, Divider, notification, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { EntityFormDrawer } from '@/components/common';
import { updateEveningSummary, getEveningSummaryById, createEveningSummary } from '../api/eveningSummaryApi';
import { eveningSummarySchema, type EveningSummaryFormValues } from '../schemas/eveningSummarySchema';
import { useGetReps, useGetDrivers, useGetProducts } from '@/api/generated';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

export interface EveningSummaryFormDrawerProps {
  open: boolean;
  onClose: () => void;
  summaryId?: number | null;
}

export const EveningSummaryFormDrawer: React.FC<EveningSummaryFormDrawerProps> = ({ open, onClose, summaryId }) => {
  const queryClient = useQueryClient();
  const submittingRef = useRef(false);

  const { data: repsData, isLoading: repsLoading } = useGetReps({ pageable: { page: 0, size: 2000 } });
  const { data: driversData, isLoading: driversLoading } = useGetDrivers({ pageable: { page: 0, size: 2000 } });
  const { data: productsData, isLoading: productsLoading } = useGetProducts({ pageable: { page: 0, size: 2000 } });

  const methods = useForm<EveningSummaryFormValues>({
    resolver: zodResolver(eveningSummarySchema),
    defaultValues: {
      repId: 0,
      driverId: 0,
      summaryDate: dayjs().format('YYYY-MM-DD'),
      items: [{ productId: 0, quantity: 1, unitPrice: 0, estimateValue: 0 }]
    }
  });

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (open) {
      if (summaryId) {
        getEveningSummaryById(summaryId).then(data => {
          reset({
            repId: data.repId,
            driverId: data.driverId,
            summaryDate: data.summaryDate,
            items: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              estimateValue: item.estimateValue
            }))
          });
        }).catch(err => {
          notification.error({ message: 'Error fetching summary', description: err.message });
          onClose();
        });
      } else {
        reset({
          repId: 0,
          driverId: 0,
          summaryDate: dayjs().format('YYYY-MM-DD'),
          items: [{ productId: 0, quantity: 1, unitPrice: 0, estimateValue: 0 }]
        });
      }
    }
  }, [open, summaryId, reset, onClose]);

  const handleProductSelect = (index: number, productId: number) => {
    const product = productsData?.content?.find((p: any) => p.id === productId);
    if (product) {
      const price = product.ratePerSoldUnit || product.basePrice || 0;
      setValue(`items.${index}.unitPrice`, price);
      const qty = watch(`items.${index}.quantity`) || 0;
      setValue(`items.${index}.estimateValue`, price * qty);
    }
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const price = watch(`items.${index}.unitPrice`) || 0;
    setValue(`items.${index}.estimateValue`, price * qty);
  };

  const onSubmit = async (data: EveningSummaryFormValues) => {
    if (submittingRef.current) return;
    try {
      submittingRef.current = true;
      if (summaryId) {
        await updateEveningSummary(summaryId, data);
        notification.success({ message: 'Summary updated successfully' });
      } else {
        await createEveningSummary(data);
        notification.success({ message: 'Summary created successfully' });
      }
      queryClient.invalidateQueries({ queryKey: ['evening-summaries'] });
      onClose();
    } catch (err: any) {
      notification.error({
        message: 'Submission failed',
        description: err.response?.data?.message || err.message
      });
    } finally {
      submittingRef.current = false;
    }
  };

  const totalEstimate = watch('items').reduce((sum, item: any) => sum + (item.estimateValue || 0), 0);

  return (
    <EntityFormDrawer
      title={summaryId ? 'Edit Evening Summary' : 'Create Evening Summary'}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Form layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Date" validateStatus={errors.summaryDate ? 'error' : ''} help={errors.summaryDate?.message}>
              <Controller
                name="summaryDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                    style={{ width: '100%' }}
                    disabled={!!summaryId}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Rep" validateStatus={errors.repId ? 'error' : ''} help={errors.repId?.message}>
              <Controller
                name="repId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    showSearch
                    placeholder="Select rep"
                    loading={repsLoading}
                    filterOption={(input, option) =>
                      (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {repsData?.content?.map((rep: any) => (
                      <Select.Option key={rep.id} value={rep.id}>{rep.name}</Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Driver" validateStatus={errors.driverId ? 'error' : ''} help={errors.driverId?.message}>
              <Controller
                name="driverId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    showSearch
                    placeholder="Select driver"
                    loading={driversLoading}
                    filterOption={(input, option) =>
                      (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {driversData?.content?.map((d: any) => (
                      <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Deducted Items</Divider>

        {fields.map((field, index) => (
          <Row gutter={16} key={field.id} style={{ marginBottom: 16, alignItems: 'flex-start' }}>
            <Col span={10}>
              <Form.Item
                validateStatus={errors.items?.[index]?.productId ? 'error' : ''}
                help={errors.items?.[index]?.productId?.message}
                style={{ marginBottom: 0 }}
              >
                <Controller
                  name={`items.${index}.productId`}
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      showSearch
                      placeholder="Select product"
                      loading={productsLoading}
                      onChange={(val) => {
                        field.onChange(val);
                        handleProductSelect(index, val);
                      }}
                      filterOption={(input, option) =>
                        (option?.label as unknown as string).toLowerCase().includes(input.toLowerCase())
                      }
                      options={productsData?.content?.map((p: any) => ({
                        label: `${p.name} (${p.sku})`,
                        value: p.id,
                        title: `${p.name} (${p.sku}) - Price: ${p.ratePerSoldUnit || p.basePrice || 0}`
                      }))}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item
                validateStatus={errors.items?.[index]?.quantity ? 'error' : ''}
                help={errors.items?.[index]?.quantity?.message}
                style={{ marginBottom: 0 }}
              >
                <Controller
                  name={`items.${index}.quantity`}
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      min={1}
                      style={{ width: '100%' }}
                      placeholder="Qty"
                      onChange={(val) => {
                        field.onChange(val);
                        handleQuantityChange(index, val || 0);
                      }}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={7}>
              <div style={{ padding: '4px 11px', background: '#f5f5f5', borderRadius: 6, border: '1px solid #d9d9d9', minHeight: 32 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Est. Value</Text>
                <Text strong>
                  LKR {new Intl.NumberFormat('en-LK').format(watch(`items.${index}.estimateValue`) || 0)}
                </Text>
              </div>
            </Col>
            <Col span={2}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                style={{ marginTop: 4 }}
              />
            </Col>
          </Row>
        ))}

        <Button
          type="dashed"
          onClick={() => append({ productId: 0, quantity: 1, unitPrice: 0, estimateValue: 0 })}
          block
          icon={<PlusOutlined />}
          style={{ marginBottom: 24 }}
        >
          Add Item
        </Button>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', background: '#f0f2f5', padding: '16px 24px', borderRadius: 8 }}>
          <Text style={{ fontSize: 16, marginRight: 16 }}>Total Estimated Value:</Text>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            LKR {new Intl.NumberFormat('en-LK').format(totalEstimate)}
          </Title>
        </div>
      </Form>
    </EntityFormDrawer>
  );
};
