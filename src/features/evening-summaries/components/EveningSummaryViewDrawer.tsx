import React from 'react';
import { Drawer, Descriptions, Table, Typography, Tag, Divider, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getEveningSummaryById, type EveningSummaryItemResponse } from '../api/eveningSummaryApi';

const { Title, Text } = Typography;

export interface EveningSummaryViewDrawerProps {
  open: boolean;
  onClose: () => void;
  summaryId?: number | null;
}

export const EveningSummaryViewDrawer: React.FC<EveningSummaryViewDrawerProps> = ({ open, onClose, summaryId }) => {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['evening-summary', summaryId],
    queryFn: () => getEveningSummaryById(summaryId!),
    enabled: open && !!summaryId,
  });

  const columns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      render: (text: string, record: EveningSummaryItemResponse) => (
        <div>
          <div>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.productSku}</Text>
        </div>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right' as const,
      render: (val: number) => `LKR ${new Intl.NumberFormat('en-LK').format(val)}`,
    },
    {
      title: 'Total',
      dataIndex: 'estimateValue',
      key: 'estimateValue',
      align: 'right' as const,
      render: (val: number) => `LKR ${new Intl.NumberFormat('en-LK').format(val)}`,
    },
  ];

  return (
    <Drawer
      title="Evening Summary Details"
      placement="right"
      width={720}
      onClose={onClose}
      open={open}
    >
      {isLoading || !summary ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>{summary.summaryNumber}</Title>
              <Text type="secondary">
                Created on {dayjs(summary.createdAt).format('MMMM D, YYYY h:mm A')}
              </Text>
            </div>
            <Tag color={summary.status === 'SETTLED' ? 'green' : 'blue'}>
              {summary.status}
            </Tag>
          </div>

          <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Date">{dayjs(summary.summaryDate).format('MMMM D, YYYY')}</Descriptions.Item>
            <Descriptions.Item label="Rep">{summary.repName}</Descriptions.Item>
            <Descriptions.Item label="Driver">{summary.driverName}</Descriptions.Item>
            <Descriptions.Item label="Inventory Processed">
              {summary.inventoryProcessed ? <Tag color="success">Yes</Tag> : <Tag color="default">No</Tag>}
            </Descriptions.Item>
            {summary.deductionWarehouseName && (
              <Descriptions.Item label="Deduction Warehouse" span={2}>
                {summary.deductionWarehouseName}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider>Deducted Items</Divider>

          <Table
            dataSource={summary.items}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
            summary={() => {
              return (
                <Table.Summary.Row style={{ background: '#fafafa' }}>
                  <Table.Summary.Cell index={0} colSpan={3} align="right">
                    <Text strong>Final Total</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong>
                      LKR {new Intl.NumberFormat('en-LK').format(summary.finalEstimateValue)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </div>
      )}
    </Drawer>
  );
};
