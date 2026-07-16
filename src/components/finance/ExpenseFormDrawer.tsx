import React from 'react';
import { Drawer, Form, Input, InputNumber, Button, DatePicker, Select, Space, message } from 'antd';
import dayjs from 'dayjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../../api/financeApi';
import type { ExpenseRequest } from '../../types/finance';

const { Option } = Select;

interface ExpenseFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ExpenseFormDrawer: React.FC<ExpenseFormDrawerProps> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const createExpenseMutation = useMutation({
    mutationFn: financeApi.createExpense,
    onSuccess: () => {
      message.success('Expense added successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      form.resetFields();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      const e = error as { response?: { data?: { message?: string } } };
      message.error(e.response?.data?.message || 'Failed to add expense');
    },
  });

  const onFinish = (values: Record<string, unknown>) => {
    const data: ExpenseRequest = {
      amount: values.amount as number,
      category: values.category as string,
      description: values.description as string | undefined,
      date: (values.date as dayjs.Dayjs).format('YYYY-MM-DD'),
    };
    createExpenseMutation.mutate(data);
  };

  return (
    <Drawer
      title="Add New Expense"
      size="default"
      onClose={onClose}
      open={open}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} loading={createExpenseMutation.isPending}>
            Save
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ date: dayjs() }}>
        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true, message: 'Please select a date' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="category"
          label="Category"
          rules={[{ required: true, message: 'Please select a category' }]}
        >
          <Select placeholder="Select category">
            <Option value="Fuel">Fuel</Option>
            <Option value="Meals">Meals</Option>
            <Option value="Vehicle Maintenance">Vehicle Maintenance</Option>
            <Option value="Office Supplies">Office Supplies</Option>
            <Option value="Utilities">Utilities</Option>
            <Option value="Other">Other</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="amount"
          label="Amount"
          rules={[{ required: true, message: 'Please enter the amount' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            formatter={(value) => `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => parseFloat(value!.replace(/Rs\.\s?|(,*)/g, '')) as any}
            min={0}
          />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={4} placeholder="Enter any additional details" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
