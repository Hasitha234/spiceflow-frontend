import React, { useState } from 'react';
import { Modal, Select, Button, Table, Typography, notification } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGetAllWarehouses } from '@/api/generated';
import type { WarehouseResponse, CancelSummaryResponse } from '@/api/generated';
import { proceedCancelSummary } from '../api/cancelSummaryApi';

const { Text } = Typography;

interface ReturnToWarehouseModalProps {
  open: boolean;
  onClose: () => void;
  summary: CancelSummaryResponse | null;
}

export const ReturnToWarehouseModal: React.FC<ReturnToWarehouseModalProps> = ({
  open,
  onClose,
  summary,
}) => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>();
  const queryClient = useQueryClient();

  const { data: warehousesData, isLoading: warehousesLoading } = useGetAllWarehouses({
    pageable: { page: 0, size: 100 },
  });

  const proceedMutation = useMutation({
    mutationFn: () => {
      if (!summary?.id || !selectedWarehouseId) throw new Error('Missing parameters');
      return proceedCancelSummary(summary.id, selectedWarehouseId);
    },
    onSuccess: () => {
      notification.success({ message: 'Summary processed successfully.' });
      queryClient.invalidateQueries({ queryKey: ['cancelSummaries'] });
      onClose();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } }, message?: string };
      notification.error({
        message: 'Proceed failed',
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
      title: 'Return Qty',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Return Value',
      dataIndex: 'estimateValue',
      key: 'estimateValue',
      render: (val: number) => (
        <span className="font-bold text-orange-700">
          {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(val)}
        </span>
      ),
    },
  ];

  const handleClose = () => {
    setSelectedWarehouseId(undefined);
    onClose();
  };

  return (
    <Modal
      title={`Proceed Cancel Summary - ${summary?.summaryNumber}`}
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button
          key="proceed"
          type="primary"
          loading={proceedMutation.isPending}
          disabled={!selectedWarehouseId}
          onClick={() => proceedMutation.mutate()}
        >
          Confirm & Proceed
        </Button>,
      ]}
      width={700}
    >
      <div className="mb-4">
        <Text strong className="block mb-2">Select Warehouse to Return Stock To:</Text>
        <Select
          style={{ width: '100%' }}
          placeholder="Select Return Warehouse"
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
          <Text strong className="block mb-2">Items to be Returned:</Text>
          <Table
            dataSource={summary?.items || []}
            columns={columns}
            rowKey="productId"
            pagination={false}
            size="small"
            bordered
          />
        </div>
      )}
    </Modal>
  );
};
