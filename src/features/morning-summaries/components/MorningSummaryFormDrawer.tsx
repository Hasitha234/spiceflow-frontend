import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, InputNumber, Select, Button, Row, Col, Typography, Spin, Divider, notification, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { EntityFormDrawer } from '@/components/common';
import { createMorningSummary } from '../api/morningSummaryApi';
import { morningSummarySchema, type MorningSummaryFormData } from '../schemas/morningSummarySchema';
import { useGetReps, useGetDrivers, useGetProducts } from '@/api/generated';
import type { ProductResponse, RepResponse, DriverResponse } from '@/api/generated';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

export interface MorningSummaryFormDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const MorningSummaryFormDrawer: React.FC<MorningSummaryFormDrawerProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();

  // Use the Orval generated hooks
  const { data: repsData, isLoading: repsLoading } = useGetReps({ pageable: { page: 0, size: 200 } });
  const { data: driversData, isLoading: driversLoading } = useGetDrivers({ pageable: { page: 0, size: 200 } });
  const { data: productsData, isLoading: productsLoading } = useGetProducts({ pageable: { page: 0, size: 200 } });

  const methods = useForm<MorningSummaryFormData>({
    resolver: zodResolver(morningSummarySchema),
    defaultValues: {
      repId: undefined,
      driverId: undefined,
      summaryDate: dayjs().format('YYYY-MM-DD'),
      items: [{ productId: 0, quantity: 1, expectedReturnAmount: 0, expectedReturnPrice: 0 }]
    }
  });

  const { control, handleSubmit, formState: { errors }, reset } = methods;

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('morning_summary_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // Ensure items array is never empty from a bad draft
        if (!parsed.items || parsed.items.length === 0) {
          parsed.items = [{ productId: 0, quantity: 1, expectedReturnAmount: 0, expectedReturnPrice: 0 }];
        }
        reset(parsed);
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }, [reset]);

  // Save draft on change
  useEffect(() => {
    const subscription = methods.watch((value) => {
      localStorage.setItem('morning_summary_draft', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [methods.watch]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = useWatch({
    control,
    name: "items"
  });

  const calculateEstimate = (index: number) => {
    const item = watchItems?.[index];
    if (!item || !item.productId || !item.quantity) return 0;
    const product = productsData?.content?.find((p: ProductResponse) => p.id === item.productId);
    if (!product) return 0;
    return (product.ratePerSoldUnit || 0) * item.quantity;
  };

  const calculateTotalEstimate = () => {
    return watchItems?.reduce((total, _, index) => total + calculateEstimate(index), 0) || 0;
  };

  const mutation = useMutation({
    mutationFn: createMorningSummary,
    onSuccess: () => {
      localStorage.removeItem('morning_summary_draft');
      reset({
        repId: undefined,
        driverId: undefined,
        summaryDate: dayjs().format('YYYY-MM-DD'),
        items: [{ productId: 0, quantity: 1, expectedReturnAmount: 0, expectedReturnPrice: 0 }]
      });
      queryClient.invalidateQueries({ queryKey: ['morningSummaries'] });
      notification.success({ message: 'Morning Summary created successfully.' });
      onClose();
    },
    onError: () => {
      notification.error({ message: 'Failed to create Morning Summary.' });
    }
  });

  const onSubmit = (data: MorningSummaryFormData) => {
    mutation.mutate({
      repId: data.repId,
      driverId: data.driverId,
      summaryDate: data.summaryDate,
      items: data.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        expectedReturnAmount: item.expectedReturnAmount || 0,
        expectedReturnPrice: item.expectedReturnPrice || 0
      }))
    });
  };

  if (repsLoading || driversLoading || productsLoading) {
    return (
      <EntityFormDrawer
        open={open}
        onClose={onClose}
        onSubmit={() => {}}
        title="Create Morning Summary"
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
      title="Create Morning Summary"
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
          <Title level={5} style={{ margin: 0 }}>Line Items</Title>
        </div>
        {errors.items?.message && <Text type="danger" className="mb-2 block">{errors.items.message}</Text>}

        {fields.map((field, index) => (
          <div key={field.id} className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
            <Row gutter={16} align="bottom">
              <Col span={1} className="pb-2">
                <Text strong>{index + 1}.</Text>
              </Col>
              <Col span={7}>
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
              <Col span={4}>
                <Controller
                  name={`items.${index}.quantity`}
                  control={control}
                  render={({ field: qField }) => (
                    <Form.Item label="Qty" style={{ margin: 0 }} validateStatus={errors.items?.[index]?.quantity ? 'error' : ''} help={errors.items?.[index]?.quantity?.message}>
                      <InputNumber {...qField} style={{ width: '100%' }} min={1} />
                    </Form.Item>
                  )}
                />
              </Col>
              <Col span={4}>
                <Controller
                  name={`items.${index}.expectedReturnAmount`}
                  control={control}
                  render={({ field: eraField }) => (
                    <Form.Item label="Ret Qty (Exp)" style={{ margin: 0 }} validateStatus={errors.items?.[index]?.expectedReturnAmount ? 'error' : ''} help={errors.items?.[index]?.expectedReturnAmount?.message}>
                      <InputNumber {...eraField} style={{ width: '100%' }} min={0} />
                    </Form.Item>
                  )}
                />
              </Col>
              <Col span={4}>
                <Controller
                  name={`items.${index}.expectedReturnPrice`}
                  control={control}
                  render={({ field: erpField }) => (
                    <Form.Item label="Ret Value (Exp)" style={{ margin: 0 }} validateStatus={errors.items?.[index]?.expectedReturnPrice ? 'error' : ''} help={errors.items?.[index]?.expectedReturnPrice?.message}>
                      <InputNumber {...erpField} style={{ width: '100%' }} min={0} prefix="Rs." />
                    </Form.Item>
                  )}
                />
              </Col>
              <Col span={3}>
                <Form.Item label="Estimate" style={{ margin: 0 }}>
                  <div className="font-semibold text-green-700 h-[32px] flex items-center">
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
          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => append({ productId: 0, quantity: 1, expectedReturnAmount: 0, expectedReturnPrice: 0 })}>
            Add Item
          </Button>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 min-w-[300px] text-right">
            <Text type="secondary">Final Estimate Value</Text>
            <Title level={3} style={{ margin: 0, color: '#1d4ed8' }}>Rs. {calculateTotalEstimate().toFixed(2)}</Title>
          </div>
        </div>
      </Form>
    </EntityFormDrawer>
  );
};
