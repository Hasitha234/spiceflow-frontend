import React, { useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, InputNumber, Modal, Row, Col, Typography, notification, DatePicker } from 'antd';
import { collectBill } from '@/api/generated';
import { billCollectionSchema, type BillCollectionFormData } from '../schemas/billSchema';
import type { BillResponse, BillCollectionRequest } from '@/api/generated';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

export interface BillCollectionModalProps {
  open: boolean;
  onClose: () => void;
  bill: BillResponse | null;
}

export const BillCollectionModal: React.FC<BillCollectionModalProps> = ({ open, onClose, bill }) => {
  const queryClient = useQueryClient();

  const methods = useForm<BillCollectionFormData>({
    resolver: zodResolver(billCollectionSchema),
    defaultValues: {
      cashCollected: 0,
      checkCollected: 0,
      loanAmount: 0,
      loanDueDate: null,
    }
  });

  const { control, handleSubmit, formState: { errors }, reset } = methods;

  // Reset form when modal opens with a bill
  React.useEffect(() => {
    if (open && bill) {
      reset({
        cashCollected: bill.finalTotal, // Default to paying full in cash
        checkCollected: 0,
        loanAmount: 0,
        loanDueDate: null,
      });
    }
  }, [open, bill, reset]);

  const watchFields = useWatch({
    control,
    name: ['cashCollected', 'checkCollected', 'loanAmount']
  });

  const watchLoanAmount = useWatch({ control, name: 'loanAmount' });

  const totalEntered = useMemo(() => {
    const [cash, check, loan] = watchFields;
    return (cash || 0) + (check || 0) + (loan || 0);
  }, [watchFields]);

  const collectMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BillCollectionRequest }) => collectBill(id, data),
    onSuccess: () => {
      notification.success({ message: 'Success', description: 'Bill collected successfully' });
      queryClient.invalidateQueries({ queryKey: ['getBills'] });
      reset();
      onClose();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to collect bill',
      });
    },
  });

  const onSubmit = (data: BillCollectionFormData) => {
    if (!bill) return;

    // Validate totals strictly
    if (Math.abs(totalEntered - (bill.finalTotal || 0)) > 0.01) {
      notification.error({ 
        message: 'Mismatch Error', 
        description: `Total collected (Rs ${totalEntered.toFixed(2)}) must exactly equal the Bill Final Total (Rs ${(bill.finalTotal || 0).toFixed(2)}).` 
      });
      return;
    }

    collectMutation.mutate({ id: bill.id as number, data: { ...data, loanDueDate: data.loanDueDate || undefined } });
  };

  if (!bill) return null;

  return (
    <Modal
      title={`Collect Bill: ${bill.billNumber}`}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={collectMutation.isPending}
      destroyOnClose
    >
      <div style={{ marginBottom: '24px', padding: '16px', background: '#e6f7ff', borderRadius: '8px', border: '1px solid #91d5ff' }}>
        <Row justify="space-between" align="middle">
          <Col><Title level={4} style={{ margin: 0, color: '#0050b3' }}>Final Total to Collect</Title></Col>
          <Col><Title level={4} style={{ margin: 0, color: '#0050b3' }}>Rs {(bill.finalTotal || 0).toFixed(2)}</Title></Col>
        </Row>
      </div>

      <Form layout="vertical">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item label="Cash Collected" validateStatus={errors.cashCollected ? 'error' : ''} help={errors.cashCollected?.message}>
              <Controller
                name="cashCollected"
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
          <Col span={24}>
            <Form.Item label="Check Collected" validateStatus={errors.checkCollected ? 'error' : ''} help={errors.checkCollected?.message}>
              <Controller
                name="checkCollected"
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
          <Col span={24}>
            <Form.Item label="Loan Amount" validateStatus={errors.loanAmount ? 'error' : ''} help={errors.loanAmount?.message}>
              <Controller
                name="loanAmount"
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
          
          {(watchLoanAmount || 0) > 0 && (
            <Col span={24}>
              <Form.Item label="Loan Due Date" validateStatus={errors.loanDueDate ? 'error' : ''} help={errors.loanDueDate?.message} required>
                <Controller
                  name="loanDueDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      style={{ width: '100%' }}
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : null)}
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>

      <div style={{ marginTop: '24px', padding: '12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
        <Row justify="space-between" align="middle">
          <Col><Text strong>Total Entered:</Text></Col>
          <Col>
            <Text strong style={{ color: Math.abs(totalEntered - (bill.finalTotal || 0)) > 0.01 ? '#ff4d4f' : '#52c41a' }}>
              Rs {totalEntered.toFixed(2)}
            </Text>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};
