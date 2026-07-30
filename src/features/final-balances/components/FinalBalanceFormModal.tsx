import { useState } from 'react';
import { Modal, Form, Select, DatePicker, Input, Button, Alert, Space, Card, Statistic, App as AntApp } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
  useCalculateBalance, 
  useSaveFinalBalance 
} from '../../../api/generated/final-balances/final-balances';
import { useGetReps, useGetDrivers } from '../../../api/generated/sales-master-data/sales-master-data';
import type { FinalBalanceCalculationResponse, FinalBalanceRequest } from '../../../api/generated/model';

const { TextArea } = Input;

interface FinalBalanceFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FinalBalanceFormModal({ open, onClose, onSuccess }: FinalBalanceFormModalProps) {
  const [form] = Form.useForm<FinalBalanceRequest>();
  const { message } = AntApp.useApp();
  const [calculation, setCalculation] = useState<FinalBalanceCalculationResponse | null>(null);

  // Fetch Reps
  const { data: repsData, isLoading: isLoadingReps } = useGetReps({
    pageable: { page: 0, size: 100 }
  });
  const reps = repsData?.content || [];

  // Fetch Drivers
  const { data: driversData, isLoading: isLoadingDrivers } = useGetDrivers({
    pageable: { page: 0, size: 100 }
  });
  const drivers = driversData?.content || [];

  const { mutate: calculateBalance, isPending: isCalculating } = useCalculateBalance({
    mutation: {
      onSuccess: (data) => {
        setCalculation(data);
        message.success('Calculation completed');
      },
      onError: (err: any) => {
        message.error(err.response?.data?.message || 'Failed to calculate balance');
        setCalculation(null);
      }
    }
  });

  const { mutate: createBalance, isPending: isSaving } = useSaveFinalBalance({
    mutation: {
      onSuccess: () => {
        onSuccess();
        form.resetFields();
        setCalculation(null);
      },
      onError: (err: any) => {
        message.error(err.response?.data?.message || 'Failed to save final balance');
      }
    }
  });

  const handleCalculate = () => {
    form.validateFields(['repId', 'balanceDate']).then((values) => {
      calculateBalance({
        data: {
          repId: values.repId,
          balanceDate: dayjs(values.balanceDate).format('YYYY-MM-DD'),
        }
      });
    }).catch(() => {
      message.warning('Please select a Rep and a Date to calculate');
    });
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (!calculation) {
        message.warning('Please calculate the balance first');
        return;
      }
      createBalance({
        data: {
          repId: values.repId,
          driverId: values.driverId,
          balanceDate: dayjs(values.balanceDate).format('YYYY-MM-DD'),
          remarks: values.remarks,
        }
      });
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setCalculation(null);
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <CalculatorOutlined className="text-xl" />
          <span>Calculate Final Balance</span>
        </Space>
      }
      open={open}
      onCancel={handleCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="calculate" onClick={handleCalculate} loading={isCalculating}>
          Calculate
        </Button>,
        <Button key="save" type="primary" onClick={handleSave} loading={isSaving} disabled={!calculation}>
          Save Balance
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          balanceDate: dayjs()
        }}
        className="mt-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="repId"
            label="Sales Rep"
            rules={[{ required: true, message: 'Please select a rep' }]}
          >
            <Select
              placeholder="Select Rep"
              loading={isLoadingReps}
              options={reps.map((r: any) => ({ label: r.name, value: r.id }))}
              onChange={() => setCalculation(null)}
            />
          </Form.Item>

          <Form.Item
            name="balanceDate"
            label="Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker 
              className="w-full" 
              onChange={() => setCalculation(null)}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="driverId"
          label="Driver (Optional)"
        >
          <Select
            placeholder="Select Driver"
            loading={isLoadingDrivers}
            options={drivers.map(d => ({ label: d.name, value: d.id }))}
            allowClear
          />
        </Form.Item>

        {calculation && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg my-6">
            <h3 className="text-lg font-semibold mb-4">Calculation Summary</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card size="small" className="bg-white dark:bg-slate-800">
                <Statistic title="Morning Summary Total" value={calculation.morningSummaryValue} precision={2} />
              </Card>
              <Card size="small" className="bg-white dark:bg-slate-800">
                <Statistic title="Cancel Summary Total" value={calculation.cancelSummaryValue} precision={2} />
              </Card>
              <Card size="small" className="bg-white dark:bg-slate-800">
                <Statistic title="Total Bill Collections (Cash+Check+Loans)" value={calculation.totalBillCollections} precision={2} />
              </Card>
              <Card size="small" className="bg-white dark:bg-slate-800 border-primary">
                <Statistic 
                  title="Mismatch" 
                  value={calculation.mismatchValue} 
                  precision={2} 
                  valueStyle={{ color: calculation.mismatchValue === 0 ? '#3f8600' : '#cf1322' }}
                />
              </Card>
            </div>
            
            <Alert
              message={`Status: ${calculation.status}`}
              description={
                calculation.status === 'BALANCED' 
                  ? 'All collections match the estimated final value.' 
                  : 'There is a discrepancy between the expected end-of-day value and the total collections.'
              }
              type={calculation.status === 'BALANCED' ? 'success' : 'warning'}
              showIcon
            />
          </div>
        )}

        <Form.Item
          name="remarks"
          label="Remarks"
        >
          <TextArea rows={3} placeholder="Add any notes about discrepancies..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
