import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Form, InputNumber, Select, Button, Row, Col, Typography, Spin, Divider, notification, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { EntityFormDrawer } from '@/components/common';
import { useCreateCancelSummary } from '@/api/generated';
import { cancelSummarySchema, type CancelSummaryFormData } from '../schemas/cancelSummarySchema';
import { useGetReps, useGetDrivers, useGetProducts } from '@/api/generated';
import type { ProductResponse, RepResponse, DriverResponse } from '@/api/generated';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

export interface CancelSummaryFormDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const CancelSummaryFormDrawer: React.FC<CancelSummaryFormDrawerProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();

  const { data: repsData, isLoading: repsLoading } = useGetReps({ pageable: { page: 0, size: 200 } });
  const { data: driversData, isLoading: driversLoading } = useGetDrivers({ pageable: { page: 0, size: 200 } });
  const { data: productsData, isLoading: productsLoading } = useGetProducts({ pageable: { page: 0, size: 200 } });

  const methods = useForm<CancelSummaryFormData>({
    resolver: zodResolver(cancelSummarySchema),
    defaultValues: {
      repId: undefined,
      driverId: undefined,
      summaryDate: dayjs().format('YYYY-MM-DD'),
      items: [{ productId: 0, quantity: 1 }]
    }
  });

  const { control, handleSubmit, formState: { errors }, reset } = methods;

  useEffect(() => {
    const savedDraft = localStorage.getItem('cancel_summary_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (!parsed.items || parsed.items.length === 0) {
          parsed.items = [{ productId: 0, quantity: 1 }];
        }
        reset(parsed);
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }, [reset]);

  useEffect(() => {
    const subscription = methods.watch((value) => {
      localStorage.setItem('cancel_summary_draft', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [methods]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = methods.watch("items");

  const calculateEstimate = (index: number) => {
    const item = watchItems?.[index];
    if (!item || !item.productId || !item.quantity) return 0;
    const product = productsData?.content?.find((p: ProductResponse) => p.id === item.productId);
    if (!product) return 0;
    const price = product.ratePerSoldUnit || product.basePrice || 0;
    return price * item.quantity;
  };

  const calculateTotalEstimate = () => {
    return watchItems?.reduce((total, _, index) => total + calculateEstimate(index), 0) || 0;
  };

  const mutation = useCreateCancelSummary({
    mutation: {
      onSuccess: () => {
      localStorage.removeItem('cancel_summary_draft');
      reset({
        repId: undefined,
        driverId: undefined,
        summaryDate: dayjs().format('YYYY-MM-DD'),
        items: [{ productId: 0, quantity: 1 }]
      });
      queryClient.invalidateQueries({ queryKey: ['cancelSummaries'] });
      notification.success({ message: 'Cancel Summary created successfully.' });
      onClose();
    },
    onError: () => {
      notification.error({ message: 'Failed to create Cancel Summary.' });
    }
    }
  });

  const onSubmit = (data: CancelSummaryFormData) => {
    mutation.mutate({
      data: {
        repId: data.repId,
        driverId: data.driverId,
        summaryDate: data.summaryDate,
        items: data.items.map((item, index) => {
          const product = productsData?.content?.find((p: ProductResponse) => p.id === item.productId);
          const price = product?.ratePerSoldUnit || product?.basePrice || 0;
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: price,
            estimateValue: calculateEstimate(index)
          };
        })
      }
    });
  };

  if (repsLoading || driversLoading || productsLoading) {
    return (
      <EntityFormDrawer
        open={open}
        onClose={onClose}
        onSubmit={() => {}}
        title="Create Cancel Summary"
      >
        <div className="flex items-center justify-center p-12"><Spin size="large" /></div>
      </EntityFormDrawer>
    );
  }

  return (
    <EntityFormDrawer
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      title="Create Cancel Summary"
      loading={mutation.isPending}
      submitText="Save Summary"
    >
      <Form layout="vertical" className="space-y-4">
        <Row gutter={16}>
          <Col span={8}>
            <Controller
              name="summaryDate"
              control={control}
              render={({ field }) => (
                <Form.Item label="Date" validateStatus={errors.summaryDate ? 'error' : ''} help={errors.summaryDate?.message}>
                  <DatePicker
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col span={8}>
            <Controller
              name="repId"
              control={control}
              render={({ field }) => (
                <Form.Item label="Rep" validateStatus={errors.repId ? 'error' : ''} help={errors.repId?.message}>
                  <Select
                    {...field}
                    placeholder="Select Rep"
                    options={repsData?.content?.map((rep: RepResponse) => ({ label: rep.name ?? '', value: rep.id ?? 0 }))}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col span={8}>
            <Controller
              name="driverId"
              control={control}
              render={({ field }) => (
                <Form.Item label="Driver" validateStatus={errors.driverId ? 'error' : ''} help={errors.driverId?.message}>
                  <Select
                    {...field}
                    placeholder="Select Driver"
                    options={driversData?.content?.map((driver: DriverResponse) => ({ label: driver.name ?? '', value: driver.id ?? 0 }))}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>

        <Divider />
        <div className="flex justify-between items-center mb-4">
          <Title level={5} style={{ margin: 0 }}>Line Items (Unsold/Returned)</Title>
        </div>
        {errors.items?.message && <Text type="danger" className="mb-2 block">{errors.items.message}</Text>}

        {fields.map((field, index) => (
          <div key={field.id} className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
            <Row gutter={16} align="bottom">
              <Col span={1} className="pb-2">
                <Text strong>{index + 1}.</Text>
              </Col>
              <Col span={11}>
                <Controller
                  name={`items.${index}.productId`}
                  control={control}
                  render={({ field: pField }) => (
                    <Form.Item label="Product" style={{ margin: 0 }} validateStatus={errors.items?.[index]?.productId ? 'error' : ''} help={errors.items?.[index]?.productId?.message}>
                      <Select
                        {...pField}
                        showSearch
                        optionFilterProp="label"
                        placeholder="Select Product"
                        popupMatchSelectWidth={false}
                        options={productsData?.content?.map((p: ProductResponse) => ({ label: p.name ?? '', value: p.id ?? 0 }))}
                      />
                    </Form.Item>
                  )}
                />
              </Col>
              <Col span={6}>
                <Controller
                  name={`items.${index}.quantity`}
                  control={control}
                  render={({ field: qField }) => (
                    <Form.Item label="Ret Qty" style={{ margin: 0 }} validateStatus={errors.items?.[index]?.quantity ? 'error' : ''} help={errors.items?.[index]?.quantity?.message}>
                      <InputNumber {...qField} style={{ width: '100%' }} min={1} onFocus={(e) => e.target.select()} />
                    </Form.Item>
                  )}
                />
              </Col>
              <Col span={5}>
                <Form.Item label="Ret Value" style={{ margin: 0 }}>
                  <div className="font-semibold text-orange-600 h-[32px] flex items-center">
                    Rs. {calculateEstimate(index).toFixed(2)}
                  </div>
                </Form.Item>
              </Col>
              <Col span={1} className="text-right">
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(index)} />
              </Col>
            </Row>
          </div>
        ))}

        <div className="mb-4">
          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => append({ productId: 0, quantity: 1 })}>
            Add Item
          </Button>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 min-w-[300px] text-right">
            <Text type="secondary">Total Return Value</Text>
            <Title level={3} style={{ margin: 0, color: '#c2410c' }}>Rs. {calculateTotalEstimate().toFixed(2)}</Title>
          </div>
        </div>
      </Form>
    </EntityFormDrawer>
  );
};
