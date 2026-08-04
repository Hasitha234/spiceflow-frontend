import React, { useCallback, useEffect, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, InputNumber, Select, Row, Col, Typography, Spin, notification, DatePicker } from 'antd';
import { EntityFormDrawer } from '@/components/common';
import { createBill } from '@/api/generated';
import { updateBill, getBillById } from '../api/billsApi';
import type { BillRequest } from '@/api/generated';
import { billSchema, type BillFormData } from '../schemas/billSchema';
import { useGetReps, useGetDrivers, useGetShops } from '@/api/generated';
import type { RepResponse, DriverResponse, ShopResponse } from '@/api/generated';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

export interface BillFormDrawerProps {
  open: boolean;
  onClose: () => void;
  billId?: number | null;
}

export const BillFormDrawer: React.FC<BillFormDrawerProps> = ({ open, onClose, billId }) => {
  const queryClient = useQueryClient();

  // Use the Orval generated hooks
  const { data: repsData, isLoading: repsLoading } = useGetReps({ pageable: { page: 0, size: 2000 } });
  const { data: driversData, isLoading: driversLoading } = useGetDrivers({ pageable: { page: 0, size: 2000 } });
  const { data: shopsData, isLoading: shopsLoading } = useGetShops({ pageable: { page: 0, size: 2000 } });

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
      returnAmount: 0,
    }
  });

  const { control, handleSubmit, formState: { errors }, reset } = methods;

  // Auto-select InputNumber content on focus for rapid data entry
  const handleNumberFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Small delay to ensure the input value is rendered before selecting
    requestAnimationFrame(() => e.target.select());
  }, []);

  // Watch fields to calculate final total
  const watchFields = useWatch({
    control,
    name: ['netTotal', 'reverseGrts', 'discount', 'skuDiscount', 'returnAmount']
  });

  const finalTotal = useMemo(() => {
    const [netTotal, reverseGrts, discount, skuDiscount, returnAmount] = watchFields;
    return (netTotal || 0) + (reverseGrts || 0) - (discount || 0) - (skuDiscount || 0) - (returnAmount || 0);
  }, [watchFields]);

  // Load draft on mount
  useEffect(() => {
    if (billId) {
      getBillById(billId).then((data) => {
        reset({
          repId: data.repId,
          driverId: data.driverId || undefined,
          shopId: data.shopId,
          billDate: data.billDate,
          netTotal: data.netTotal,
          reverseGrts: data.reverseGrts,
          freeItemsValue: data.freeItemsValue,
          discount: data.discount,
          skuDiscount: data.skuDiscount,
          returnAmount: data.returnAmount,
        });
      }).catch((e) => {
        console.error("Failed to load bill", e);
        notification.error({ message: 'Failed to load bill for editing' });
      });
    } else {
      const savedDraft = localStorage.getItem('bill_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          reset(parsed);
        } catch (e) {
          console.error("Failed to parse bill draft", e);
        }
      } else {
        reset({
          repId: undefined,
          driverId: undefined,
          shopId: undefined,
          billDate: dayjs().format('YYYY-MM-DD'),
          netTotal: 0,
          reverseGrts: 0,
          freeItemsValue: 0,
          discount: 0,
          skuDiscount: 0,
          returnAmount: 0,
        });
      }
    }
  }, [reset, billId, open]);

  // Save draft on change
  useEffect(() => {
    if (billId) return;
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = methods.watch((value) => {
      localStorage.setItem('bill_draft', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [methods, billId]);

  const createMutation = useMutation({
    mutationFn: (data: BillRequest) => createBill(data),
    onSuccess: () => {
      notification.success({ message: 'Success', description: 'Bill created successfully' });
      localStorage.removeItem('bill_draft');
      // Force an immediate refetch of all active bill queries
      queryClient.invalidateQueries({ queryKey: ['getBills'], refetchType: 'all' });
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

  const updateMut = useMutation({
    mutationFn: (data: BillFormData) => updateBill(billId!, data),
    onSuccess: () => {
      notification.success({ message: 'Success', description: 'Bill updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['getBills'], refetchType: 'all' });
      onClose();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to update bill',
      });
    },
  });

  const onSubmit = (data: BillFormData) => {
    if (finalTotal < 0) {
      notification.error({ message: 'Error', description: 'Final total cannot be negative.' });
      return;
    }
    const formattedData = {
      ...data,
      driverId: data.driverId || undefined,
      reverseGrts: data.reverseGrts ?? 0,
      freeItemsValue: data.freeItemsValue ?? 0,
      discount: data.discount ?? 0,
      skuDiscount: data.skuDiscount ?? 0,
      returnAmount: data.returnAmount ?? 0,
    };

    if (billId) {
      updateMut.mutate(formattedData);
    } else {
      createMutation.mutate(formattedData as import('@/api/generated').BillRequest);
    }
  };

  const isDataLoading = repsLoading || driversLoading || shopsLoading;

  return (
    <EntityFormDrawer
      title={billId ? "Edit Bill" : "Create Bill"}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      loading={createMutation.isPending || updateMut.isPending || isDataLoading}
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
                    placeholder="Select Shop"
                    loading={shopsLoading}
                    filterOption={(input, option) => {
                      const label = String(option?.label ?? '');
                      return label.toLowerCase().includes(input.toLowerCase());
                    }}
                    options={shopsData?.content?.map((shop: ShopResponse) => ({
                      value: shop.id,
                      label: shop.outletId
                        ? `${shop.name} (${shop.outletId})`
                        : shop.name ?? '',
                    }))}
                  />
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
                    placeholder="Enter amount"
                    onFocus={handleNumberFocus}
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
                    placeholder="Enter amount"
                    onFocus={handleNumberFocus}
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
                    placeholder="Enter amount"
                    onFocus={handleNumberFocus}
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
                    placeholder="Enter amount"
                    onFocus={handleNumberFocus}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Return Amount" validateStatus={errors.returnAmount ? 'error' : ''} help={errors.returnAmount?.message}>
              <Controller
                name="returnAmount"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    prefix="Rs"
                    placeholder="Enter amount"
                    onFocus={handleNumberFocus}
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
            <Col><Text type="secondary">Formula: Net Total + Reverse GRTs - Discount - SKU Discount - Return Amount</Text></Col>
          </Row>
        </div>
      </Spin>
    </EntityFormDrawer>
  );
};
