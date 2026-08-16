import React, { useState, useEffect } from 'react';
import { Modal, Select, Table, Typography, Tag, Alert, Button, Spin, notification } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checkStockAvailability, proceedEveningSummary } from '../api/eveningSummaryApi';
import { getAllWarehouses } from '@/api/generated/warehouses/warehouses';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface ProceedWithStockCheckModalProps {
  open: boolean;
  onClose: () => void;
  summaryId: number;
}

export const ProceedWithStockCheckModal: React.FC<ProceedWithStockCheckModalProps> = ({ open, onClose, summaryId }) => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>(undefined);
  const [isProceeding, setIsProceeding] = useState(false);
  const queryClient = useQueryClient();

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getAllWarehouses({ pageable: { page: 0, size: 2000 } }),
  });

  const { data: stockStatus, isLoading: isCheckingStock } = useQuery({
    queryKey: ['evening-summary-stock-check', summaryId, selectedWarehouseId],
    queryFn: () => checkStockAvailability(summaryId, selectedWarehouseId!),
    enabled: !!selectedWarehouseId,
  });

  useEffect(() => {
    if (!open) {
      setSelectedWarehouseId(undefined);
    }
  }, [open]);

  const hasShortage = stockStatus?.some((item: any) => !item.sufficient);
  const canProceed = !!selectedWarehouseId && !isCheckingStock && stockStatus && !hasShortage;

  const handleProceed = async () => {
    if (!selectedWarehouseId || hasShortage) return;
    
    setIsProceeding(true);
    try {
      await proceedEveningSummary(summaryId, selectedWarehouseId);
      notification.success({ message: 'Evening summary processed successfully.' });
      queryClient.invalidateQueries({ queryKey: ['evening-summaries'] });
      onClose();
    } catch (error: any) {
      notification.error({
        message: 'Error processing summary',
        description: error.response?.data?.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsProceeding(false);
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Sold Qty',
      dataIndex: 'soldQuantity',
      key: 'soldQuantity',
      align: 'right' as const,
    },
    {
      title: 'Available Qty',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      align: 'right' as const,
    },
    {
      title: 'Short Qty',
      dataIndex: 'shortQuantity',
      key: 'shortQuantity',
      align: 'right' as const,
      render: (val: number, record: any) => (
        <Text type={record.sufficient ? 'secondary' : 'danger'} strong={!record.sufficient}>
          {val}
        </Text>
      )
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center' as const,
      render: (_: any, record: any) => (
        record.sufficient ? 
          <Tag icon={<CheckCircleOutlined />} color="success">Sufficient</Tag> : 
          <Tag icon={<CloseCircleOutlined />} color="error">Short</Tag>
      )
    }
  ];

  return (
    <Modal
      title="Proceed Evening Summary"
      open={open}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="back" onClick={onClose} disabled={isProceeding}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={isProceeding} 
          onClick={handleProceed}
          disabled={!canProceed}
        >
          Confirm & Proceed
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Select Warehouse for Deduction</Text>
        <Select
          style={{ width: '100%' }}
          placeholder="Select warehouse..."
          value={selectedWarehouseId}
          onChange={setSelectedWarehouseId}
          options={warehousesData?.content?.map((wh: any) => ({ label: wh.name, value: wh.id }))}
        />
      </div>

      {selectedWarehouseId && (
        <div style={{ marginTop: 24 }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>Stock Availability Check</Text>
          
          {isCheckingStock ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Spin />
            </div>
          ) : stockStatus ? (
            <>
              <Table 
                columns={columns} 
                dataSource={stockStatus}
                rowKey="productId"
                pagination={false}
                size="small"
                style={{ marginBottom: 16 }}
                rowClassName={(record) => !record.sufficient ? 'row-error' : ''}
              />
              {hasShortage ? (
                <Alert
                  message="Insufficient Stock"
                  description="One or more products are short. Please replenish stock or select a different warehouse before proceeding."
                  type="error"
                  showIcon
                />
              ) : (
                <Alert
                  message="Ready to Proceed"
                  description="All items have sufficient stock in the selected warehouse."
                  type="success"
                  showIcon
                />
              )}
            </>
          ) : null}
        </div>
      )}
      
      <style>{`
        .row-error {
          background-color: #fff1f0;
        }
      `}</style>
    </Modal>
  );
};
