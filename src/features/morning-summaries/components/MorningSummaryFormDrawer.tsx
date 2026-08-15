import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, InputNumber, Select, Row, Col, Spin, notification, DatePicker } from 'antd';
import { EntityFormDrawer } from '@/components/common';
import { createMorningSummary, updateMorningSummary, getMorningSummaryById } from '../api/morningSummaryApi';
import { morningSummarySchema, type MorningSummaryFormData } from '../schemas/morningSummarySchema';
import { useGetReps, useGetDrivers } from '@/api/generated';
import type { RepResponse, DriverResponse } from '@/api/generated';
import dayjs from 'dayjs';



export interface MorningSummaryFormDrawerProps {
  open: boolean;
  onClose: () => void;
  summaryId?: number | null;
}

export const MorningSummaryFormDrawer: React.FC<MorningSummaryFormDrawerProps> = ({ open, onClose, summaryId }) => {
  const queryClient = useQueryClient();

  // Use the Orval generated hooks
  const { data: repsData, isLoading: repsLoading } = useGetReps({ pageable: { page: 0, size: 2000 } });
  const { data: driversData, isLoading: driversLoading } = useGetDrivers({ pageable: { page: 0, size: 2000 } });

  const methods = useForm<MorningSummaryFormData>({
    resolver: zodResolver(morningSummarySchema),
    defaultValues: {
      repId: undefined,
      driverId: undefined,
      summaryDate: dayjs().format('YYYY-MM-DD'),
      finalEstimateValue: 0
    }
  });

  const { control, handleSubmit, formState: { errors }, reset } = methods;

  // Load draft on mount for creation mode, or fetch existing data for edit mode
  useEffect(() => {
    if (summaryId) {
      // Edit mode: fetch existing summary
      getMorningSummaryById(summaryId).then((data) => {
        reset({
          repId: data.repId,
          driverId: data.driverId,
          summaryDate: data.summaryDate,
          finalEstimateValue: data.finalEstimateValue || 0
        });
      }).catch((e) => {
        console.error('Failed to load summary', e);
        notification.error({ message: 'Failed to load summary for editing' });
      });
    } else {
      // Create mode: load draft
      const savedDraft = localStorage.getItem('morning_summary_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          reset(parsed);
        } catch (e) {
          console.error('Failed to parse draft', e);
        }
      } else {
        reset({
          repId: undefined,
          driverId: undefined,
          summaryDate: dayjs().format('YYYY-MM-DD'),
          finalEstimateValue: 0
        });
      }
    }
  }, [reset, summaryId, open]);

  // Save draft on change (only for creation mode)
  useEffect(() => {
    if (summaryId) return; // Do not save drafts while editing an existing record
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = methods.watch((value) => {
      localStorage.setItem('morning_summary_draft', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [methods, summaryId]);

  const createMutation = useMutation({
    mutationFn: createMorningSummary,
    onSuccess: () => {
      localStorage.removeItem('morning_summary_draft');
      reset({
        repId: undefined,
        driverId: undefined,
        summaryDate: dayjs().format('YYYY-MM-DD'),
        finalEstimateValue: 0
      });
      queryClient.invalidateQueries({ queryKey: ['morningSummaries'] });
      notification.success({ message: 'Morning Summary created successfully.' });
      onClose();
    },
    onError: () => {
      notification.error({ message: 'Failed to create Morning Summary.' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: MorningSummaryFormData) => updateMorningSummary(summaryId!, {
      repId: data.repId,
      driverId: data.driverId,
      summaryDate: data.summaryDate,
      finalEstimateValue: data.finalEstimateValue
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morningSummaries'] });
      notification.success({ message: 'Morning Summary updated successfully.' });
      onClose();
    },
    onError: () => {
      notification.error({ message: 'Failed to update Morning Summary.' });
    }
  });

  const onSubmit = (data: MorningSummaryFormData) => {
    if (summaryId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate({
        repId: data.repId,
        driverId: data.driverId,
        summaryDate: data.summaryDate,
        finalEstimateValue: data.finalEstimateValue
      });
    }
  };

  if (repsLoading || driversLoading) {
    return (
      <EntityFormDrawer
        open={open}
        onClose={onClose}
        onSubmit={() => {}}
        title={summaryId ? "Edit Morning Summary" : "Create Morning Summary"}
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
      title={summaryId ? "Edit Morning Summary" : "Create Morning Summary"}
      loading={summaryId ? updateMutation.isPending : createMutation.isPending}
      submitText={summaryId ? "Save Changes" : "Save Summary"}
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
          <Col span={8}>
            <Controller
              name="finalEstimateValue"
              control={control}
              render={({ field }) => (
                <Form.Item label="Final Estimate Value" validateStatus={errors.finalEstimateValue ? 'error' : ''} help={errors.finalEstimateValue?.message}>
                  <InputNumber 
                    {...field} 
                    style={{ width: '100%' }} 
                    min={0.01} 
                    prefix="Rs." 
                    onFocus={(e) => e.target.select()} 
                    size="large"
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
      </Form>
    </EntityFormDrawer>
  );
};
