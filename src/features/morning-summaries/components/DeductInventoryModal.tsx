import React, { useState } from 'react';
import { Modal, Select, Button, Table, Typography, Tag, notification } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGetAllWarehouses } from '@/api/generated';
import type { WarehouseResponse } from '@/api/generated';
import { preCheckDeduction, deductFromInventory } from '../api/morningSummaryApi';
import type { MorningSummary, ItemAvailability } from '../types';

const { Text } = Typography;

interface DeductInventoryModalProps {
  open: boolean;
  onClose: () => void;
  summary: MorningSummary | null;
}

export const DeductInventoryModal: React.FC<DeductInventoryModalProps> = ({
  open,
  onClose,
  summary,
}) => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>();
  const queryClient = useQueryClient();

  const { data: warehousesData, isLoading: warehousesLoading } = useGetAllWarehouses({
    pageable: { page: 0, size: 100 },
  });

  const { data: preCheckData, isLoading: preCheckLoading, error: preCheckError } = useQuery({
    queryKey: ['deductPreCheck', summary?.id, selectedWarehouseId],
    queryFn: () => {
      if (!summary?.id || !selectedWarehouseId) return null;
      return preCheckDeduction(summary.id, selectedWarehouseId);
    },
    enabled: !!summary?.id && !!selectedWarehouseId,
  });

  const deductMutation = useMutation({
    mutationFn: () => {
      if (!summary?.id || !selectedWarehouseId) throw new Error('Missing parameters');
      return deductFromInventory(summary.id, selectedWarehouseId);
    },
    onSuccess: () => {
      notification.success({ message: 'Inventory deducted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['morningSummaries'] });
      onClose();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } }, message?: string };
      notification.error({
        message: 'Deduction failed',
        description: error?.response?.data?.message || error?.message || 'Unknown error occurred',
      });
    },
  });

  const columns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Required Qty',
      dataIndex: 'requiredQuantity',
      key: 'requiredQuantity',
    },
    {
      title: 'Available Qty',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: ItemAvailability) => {
        if (record.sufficient) {
          return <Tag color="success">✅ Sufficient</Tag>;
        }
        const diff = record.requiredQuantity - record.availableQuantity;
        return <Tag color="error">❌ Short by {diff}</Tag>;
      },
    },
  ];

  const handleClose = () => {
    setSelectedWarehouseId(undefined);
    onClose();
  };

  return (
    <Modal
      title={`Deduct Inventory - Summary ${summary?.summaryNumber}`}
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button
          key="deduct"
          type="primary"
          danger
          loading={deductMutation.isPending}
          disabled={!selectedWarehouseId || !preCheckData?.canDeduct}
          onClick={() => deductMutation.mutate()}
        >
          Confirm Deduction
        </Button>,
      ]}
      width={700}
    >
      <div className="mb-4">
        <Text strong className="block mb-2">Select Warehouse to Deduct From:</Text>
        <Select
          style={{ width: '100%' }}
          placeholder="Select Warehouse"
          loading={warehousesLoading}
          value={selectedWarehouseId}
          onChange={setSelectedWarehouseId}
          options={warehousesData?.content?.map((w: WarehouseResponse) => ({
            label: w.name ?? '',
            value: w.id ?? 0,
          }))}
        />
      </div>

      {selectedWarehouseId && (
        <div className="mt-4">
          <Text strong className="block mb-2">Inventory Check Results:</Text>
          <Table
            dataSource={preCheckData?.items || []}
            columns={columns}
            rowKey="productId"
            pagination={false}
            size="small"
            loading={preCheckLoading}
            bordered
          />

          {!preCheckLoading && preCheckData && !preCheckData.canDeduct && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">
              Cannot deduct: One or more products have insufficient inventory in this warehouse.
            </div>
          )}
          {preCheckError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">
              Error checking inventory. Please try again.
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
