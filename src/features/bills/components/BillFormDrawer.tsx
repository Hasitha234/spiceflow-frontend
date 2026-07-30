import React, { useEffect, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, InputNumber, Select, Row, Col, Typography, Spin, notification, DatePicker } from 'antd';
import { EntityFormDrawer } from '@/components/common';
import { createBill } from '@/api/generated';
import type { BillRequest } from '@/api/generated';
import { billSchema, type BillFormData } from '../schemas/billSchema';
import { useGetReps, useGetDrivers, useGetShops } from '@/api/generated';
import type { RepResponse, DriverResponse, ShopResponse } from '@/api/generated';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

export interface BillFormDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const BillFormDrawer: React.FC<BillFormDrawerProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();

  // Use the Orval generated hooks
  const { data: repsData, isLoading: repsLoading } = useGetReps({ pageable: { page: 0, size: 200 } });
  const { data: driversData, isLoading: driversLoading } = useGetDrivers({ pageable: { page: 0, size: 200 } });
  const { data: shopsData, isLoading: shopsLoading } = useGetShops({ pageable: { page: 0, size: 200 } });

  const methods = useForm<BillFormData>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      repId: undefined,
      driverId: undefined,
      shopId: undefined,
      billDate: dayjs().format('YYYY-MM-DD'),
      netTotal: 0,
      reverseGrts: 0,
      freeItemsValue: 0,
      discount: 0,
      skuDiscount: 0,
    }
  });

  const { control, handleSubmit, formState: { errors }, reset } = methods;

  // Watch fields to calculate final total
  const watchFields = useWatch({
    control,
    name: ['netTotal', 'reverseGrts', 'discount', 'skuDiscount']
  });

  const finalTotal = useMemo(() => {
    const [netTotal, reverseGrts, discount, skuDiscount] = watchFields;
    return (netTotal || 0) + (reverseGrts || 0) - (discount || 0) - (skuDiscount || 0);
  }, [watchFields]);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('bill_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        reset(parsed);
      } catch (e) {
        console.error("Failed to parse bill draft", e);
      }
    }
  }, [reset]);

  // Save draft on change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = methods.watch((value) => {
      localStorage.setItem('bill_draft', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [methods]);

  const createMutation = useMutation({
    mutationFn: (data: BillRequest) => createBill(data),
    onSuccess: () => {
      notification.success({ message: 'Success', description: 'Bill created successfully' });
      localStorage.removeItem('bill_draft');
      queryClient.invalidateQueries({ queryKey: ['getBills'] });
      reset();
      onClose();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to create bill',
      });
    },
  });

  const onSubmit = (data: BillFormData) => {
    if (finalTotal < 0) {
      notification.error({ message: 'Error', description: 'Final total cannot be negative.' });
      return;
    }
    createMutation.mutate({ ...data, driverId: data.driverId || undefined });
  };

  const isDataLoading = repsLoading || driversLoading || shopsLoading;

  return (
    <EntityFormDrawer
      title="Create Bill"
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      loading={createMutation.isPending || isDataLoading}
    >
      <Spin spinning={isDataLoading}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item label="Bill Date" validateStatus={errors.billDate ? 'error' : ''} help={errors.billDate?.message}>
              <Controller
                name="billDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    style={{ width: '100%' }}
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Rep" validateStatus={errors.repId ? 'error' : ''} help={errors.repId?.message} required>
              <Controller
                name="repId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    showSearch
                    optionFilterProp="children"
                    placeholder="Select Rep"
                    loading={repsLoading}
                  >
                    {repsData?.content?.map((rep: RepResponse) => (
                      <Select.Option key={rep.id} value={rep.id}>
                        {rep.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Driver (Optional)" validateStatus={errors.driverId ? 'error' : ''} help={errors.driverId?.message}>
              <Controller
                name="driverId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    showSearch
                    allowClear
                    optionFilterProp="children"
                    placeholder="Select Driver"
                    loading={driversLoading}
                  >
                    {driversData?.content?.map((driver: DriverResponse) => (
                      <Select.Option key={driver.id} value={driver.id}>
                        {driver.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Shop" validateStatus={errors.shopId ? 'error' : ''} help={errors.shopId?.message} required>
              <Controller
                name="shopId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    showSearch
                    optionFilterProp="children"
                    placeholder="Select Shop"
                    loading={shopsLoading}
                  >
                    {shopsData?.content?.map((shop: ShopResponse) => (
                      <Select.Option key={shop.id} value={shop.id}>
                        {shop.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Title level={5} style={{ marginTop: '24px' }}>Financials</Title>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item label="Net Total" validateStatus={errors.netTotal ? 'error' : ''} help={errors.netTotal?.message}>
              <Controller
                name="netTotal"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    prefix="Rs"
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Reverse GRTs" validateStatus={errors.reverseGrts ? 'error' : ''} help={errors.reverseGrts?.message}>
              <Controller
                name="reverseGrts"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    prefix="Rs"
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Free Items Value" validateStatus={errors.freeItemsValue ? 'error' : ''} help={errors.freeItemsValue?.message}>
              <Controller
                name="freeItemsValue"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    prefix="Rs"
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Discount" validateStatus={errors.discount ? 'error' : ''} help={errors.discount?.message}>
              <Controller
                name="discount"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    prefix="Rs"
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="SKU Discount" validateStatus={errors.skuDiscount ? 'error' : ''} help={errors.skuDiscount?.message}>
              <Controller
                name="skuDiscount"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    prefix="Rs"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <div style={{ marginTop: '24px', padding: '16px', background: '#fafafa', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
          <Row justify="space-between" align="middle">
            <Col><Title level={4} style={{ margin: 0 }}>Final Total</Title></Col>
            <Col><Title level={4} style={{ margin: 0, color: finalTotal < 0 ? '#ff4d4f' : '#1890ff' }}>Rs {finalTotal.toFixed(2)}</Title></Col>
          </Row>
          <Row justify="space-between" align="middle" style={{ marginTop: '8px' }}>
            <Col><Text type="secondary">Formula: Net Total + Reverse GRTs - Discount - SKU Discount</Text></Col>
          </Row>
        </div>
      </Spin>
    </EntityFormDrawer>
  );
};
