import React, { useState, useEffect } from 'react';
import { Modal, Select, Form, Typography, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { loadingSheetApi } from '../../../api/sales';
import { warehouseApi } from '../../../api/inventory';
import type { LoadingSheet } from '../../../types/sales';
import type { Warehouse } from '../../../types/inventory';

const { Text, Paragraph } = Typography;

interface CancelOrderModalProps {
  visible: boolean;
  loadingSheet: LoadingSheet | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  visible,
  loadingSheet,
  onClose,
  onSuccess,
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWh, setLoadingWh] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      form.resetFields();
      fetchWarehouses();
    }
  }, [visible, form]);

  const fetchWarehouses = async () => {
    setLoadingWh(true);
    try {
      const res = await warehouseApi.list({ size: 100 });
      const list = res?.content || [];
      // Filter out vehicle warehouses from target destinations, keep MAIN and CUSTOM physical stores
      const nonVehicleList = list.filter(w => w.storeType !== 'VEHICLE' && !w.name.startsWith('Vehicle - '));
      setWarehouses(nonVehicleList);

      // Default to MAIN store if available
      const mainWh = nonVehicleList.find(w => w.storeType === 'MAIN');
      if (mainWh && mainWh.id) {
        form.setFieldsValue({ returnWarehouseId: Number(mainWh.id) });
      } else if (nonVehicleList.length > 0 && nonVehicleList[0].id) {
        form.setFieldsValue({ returnWarehouseId: Number(nonVehicleList[0].id) });
      }
    } catch (error) {
      console.error('Failed to load warehouses', error);
      message.error('Could not load destination warehouses');
    } finally {
      setLoadingWh(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!loadingSheet) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await loadingSheetApi.cancel(loadingSheet.id, values.returnWarehouseId);
      message.success(`Loading Sheet #${loadingSheet.id} cancelled successfully and remaining stock returned.`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Cancel order failed:', error);
      message.error(error?.response?.data?.message || 'Failed to cancel loading sheet.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loadingSheet) return null;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-rose-600 font-semibold">
          <ExclamationCircleOutlined />
          <span>Cancel Order & Lorry Unload</span>
        </div>
      }
      open={visible}
      onOk={handleCancelOrder}
      onCancel={onClose}
      confirmLoading={submitting}
      okText="Confirm Cancellation & Return Stock"
      okButtonProps={{ danger: true, type: 'primary' }}
      cancelText="Close"
      mask={{ closable: false }}
      destroyOnHidden
    >
      <div className="py-2">
        <Paragraph className="text-slate-600">
          You are about to cancel Loading Sheet <Text strong>#{loadingSheet.id}</Text> assigned to driver <Text strong>{loadingSheet.driverName || loadingSheet.driver?.name}</Text>.
        </Paragraph>
        <Paragraph className="text-slate-600 mb-4">
          Any items currently loaded inside the vehicle (`Vehicle - {loadingSheet.driverName || loadingSheet.driver?.name}`) will be reversed and unloaded back to the destination warehouse selected below.
        </Paragraph>

        <Form form={form} layout="vertical">
          <Form.Item
            name="returnWarehouseId"
            label={<Text strong className="text-slate-800">Destination Warehouse for Unloaded Items</Text>}
            rules={[{ required: true, message: 'Please select destination warehouse' }]}
          >
            <Select
              loading={loadingWh}
              placeholder="Select warehouse to unload remaining items"
              size="large"
              options={warehouses.map(w => ({
                label: `${w.name} ${w.storeType === 'MAIN' ? '(MAIN STORE)' : ''}`,
                value: Number(w.id),
              }))}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
