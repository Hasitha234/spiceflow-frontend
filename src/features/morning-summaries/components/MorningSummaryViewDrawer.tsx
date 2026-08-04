import React from 'react';
import { Drawer, Descriptions, Table, Tag, Typography, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MorningSummary, MorningSummaryItem } from '../types';

const { Text } = Typography;

export interface MorningSummaryViewDrawerProps {
  open: boolean;
  onClose: () => void;
  summary: MorningSummary | null;
}

export const MorningSummaryViewDrawer: React.FC<MorningSummaryViewDrawerProps> = ({
  open,
  onClose,
  summary,
}) => {
  if (!summary) return null;

  const itemColumns: ColumnsType<MorningSummaryItem> = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      render: (text) => <Text strong>{text || 'Unknown Product'}</Text>,
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right',
      render: (val) => val ? new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(val) : '-',
    },
    {
      title: 'Est. Value',
      dataIndex: 'estimateValue',
      key: 'estimateValue',
      align: 'right',
      render: (val) => val ? new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(val) : '-',
    },
    {
      title: 'Exp. Return Qty',
      dataIndex: 'expectedReturnAmount',
      key: 'expectedReturnAmount',
      align: 'right',
      render: (val) => val || '-',
    },
  ];

  const renderStatus = (status: string) => {
    let color = 'default';
    if (status === 'SETTLED') color = 'success';
    if (status === 'CANCELLED') color = 'error';
    if (status === 'PENDING') color = 'processing';
    return <Tag color={color}>{status}</Tag>;
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-3">
          <span>Morning Summary Details</span>
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
          {new Date(summary.summaryDate).toLocaleDateString()}
        </Descriptions.Item>
        <Descriptions.Item label="Rep">
          {summary.repName}
        </Descriptions.Item>
        <Descriptions.Item label="Driver">
          {summary.driverName}
        </Descriptions.Item>
        {summary.deductedWarehouseName && (
          <Descriptions.Item label="Source Warehouse" span={2}>
            {summary.deductedWarehouseName}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Est. Total Value" span={2}>
          <Text strong className="text-green-700 text-lg">
            {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(summary.finalEstimateValue)}
          </Text>
        </Descriptions.Item>
      </Descriptions>

      <Text strong className="text-base block mb-4">Line Items</Text>
      <Table
        dataSource={summary.items}
        columns={itemColumns}
        rowKey="productId"
        pagination={false}
        size="small"
        bordered
      />
    </Drawer>
  );
};
