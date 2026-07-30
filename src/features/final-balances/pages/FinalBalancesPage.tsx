import { useState } from 'react';
import { Card, Button, Table, Typography, Tag, Space, App as AntApp } from 'antd';
import { PlusOutlined, CalculatorOutlined } from '@ant-design/icons';
import { useGetFinalBalances } from '../../../api/generated/final-balances/final-balances';
import type { FinalBalanceResponse } from '../../../api/generated/model';
import { FinalBalanceFormModal } from '../components/FinalBalanceFormModal';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export function FinalBalancesPage() {
  const { message } = AntApp.useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, refetch } = useGetFinalBalances({
    pageable: {
      page: currentPage,
      size: pageSize,
      sort: ['balanceDate,desc']
    }
  });

  const columns = [
    {
      title: 'Date',
      dataIndex: 'balanceDate',
      key: 'balanceDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Rep',
      dataIndex: 'repName',
      key: 'repName',
    },
    {
      title: 'Driver',
      dataIndex: 'driverName',
      key: 'driverName',
      render: (name: string | null) => name || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'BALANCED' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Morning Value',
      dataIndex: 'morningSummaryValue',
      key: 'morningSummaryValue',
      render: (val: number) => val.toFixed(2),
    },
    {
      title: 'Cancel Value',
      dataIndex: 'cancelSummaryValue',
      key: 'cancelSummaryValue',
      render: (val: number) => val.toFixed(2),
    },
    {
      title: 'Bill Collections',
      dataIndex: 'totalBillCollections',
      key: 'totalBillCollections',
      render: (val: number) => val.toFixed(2),
    },
    {
      title: 'Mismatch',
      dataIndex: 'mismatchValue',
      key: 'mismatchValue',
      render: (val: number) => (
        <Text type={val === 0 ? 'success' : 'danger'}>
          {val.toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (val: string | null) => val || '-',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="!mb-1">
            <Space>
              <CalculatorOutlined className="text-2xl" />
              Final Balances
            </Space>
          </Title>
          <Text type="secondary">Manage rep end-of-day balances and calculate discrepancies</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center"
        >
          Calculate Balance
        </Button>
      </div>

      <Card>
        <Table<FinalBalanceResponse>
          columns={columns}
          dataSource={data?.content}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: currentPage + 1,
            pageSize: pageSize,
            total: data?.totalElements,
            onChange: (page, size) => {
              setCurrentPage(page - 1);
              setPageSize(size);
            },
          }}
        />
      </Card>

      <FinalBalanceFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          refetch();
          message.success('Final balance successfully calculated and saved');
        }}
      />
    </div>
  );
}
