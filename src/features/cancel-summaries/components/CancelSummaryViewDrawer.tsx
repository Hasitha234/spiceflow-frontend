import React from 'react';
import { Drawer, Descriptions, Table, Tag, Typography, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CancelSummaryResponse, CancelSummaryItemResponse } from '@/api/generated';
import dayjs from 'dayjs';

const { Text } = Typography;

export interface CancelSummaryViewDrawerProps {
  open: boolean;
  onClose: () => void;
  summary: CancelSummaryResponse | null;
}

export const CancelSummaryViewDrawer: React.FC<CancelSummaryViewDrawerProps> = ({
  open,
  onClose,
  summary,
}) => {
  if (!summary) return null;

  const itemColumns: ColumnsType<CancelSummaryItemResponse> = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      render: (text) => <Text strong>{text || 'Unknown Product'}</Text>,
    },
    {
      title: 'Qty Sold',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right',
      render: (val) => val != null ? new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(val) : '-',
    },
    {
      title: 'Est. Value',
      dataIndex: 'estimateValue',
      key: 'estimateValue',
      align: 'right',
      render: (val) => val != null ? new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(val) : '-',
    },
  ];

  const renderStatus = (status?: string) => {
    let color = 'default';
    if (status === 'SETTLED') color = 'success';
    if (status === 'CANCELLED') color = 'error';
    if (status === 'PENDING') color = 'processing';
    return <Tag color={color}>{status || 'UNKNOWN'}</Tag>;
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-3">
          <span>Evening Summary Details</span>
          {renderStatus(summary.status)}
        </div>
      }
      width={700}
      onClose={onClose}
      open={open}
      footer={
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      }
    >
      <Descriptions bordered column={2} size="small" className="mb-6">
        <Descriptions.Item label="Summary No">
          <Text strong className="text-blue-600">{summary.summaryNumber}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Date">
          {summary.summaryDate ? dayjs(summary.summaryDate).format('YYYY-MM-DD') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Rep">
          {summary.repName || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Driver">
          {summary.driverName || '-'}
        </Descriptions.Item>
        {summary.returnWarehouseName && (
          <Descriptions.Item label="Deduction Warehouse" span={1}>
            {summary.returnWarehouseName}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Inventory Processed" span={summary.returnWarehouseName ? 1 : 2}>
          {summary.inventoryProcessed ? <Tag color="success">Yes</Tag> : <Tag color="default">No</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="Est. Total Value" span={2}>
          <Text strong className="text-gray-900 text-lg">
            {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(summary.finalEstimateValue || 0)}
          </Text>
        </Descriptions.Item>
      </Descriptions>

      <Text strong className="text-base block mb-4">Line Items</Text>
      <Table
        dataSource={summary.items || []}
        columns={itemColumns}
        rowKey="productId"
        pagination={false}
        size="small"
        bordered
      />
    </Drawer>
  );
};
