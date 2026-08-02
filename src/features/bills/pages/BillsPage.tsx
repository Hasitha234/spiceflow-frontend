import { useState } from 'react';
import { Typography, Button, Table, Space, Tag, Modal, notification, Row, Col, Input, DatePicker, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBills, cancelBill, useGetReps, useGetShops } from '@/api/generated';
import type { BillResponse } from '@/api/generated';
import { PageHeader } from '@/components/common';
import { BillFormDrawer } from '../components/BillFormDrawer';
import { BillCollectionModal } from '../components/BillCollectionModal';


const { Text } = Typography;

export function BillsPage() {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillResponse | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({
    billDate: undefined as string | undefined,
    repId: undefined as number | undefined,
    shopId: undefined as number | undefined,
    status: undefined as string | undefined,
    search: undefined as string | undefined,
  });

  const { data: repsData, isLoading: repsLoading } = useGetReps({ pageable: { page: 0, size: 2000 } });
  const { data: shopsData, isLoading: shopsLoading } = useGetShops({ pageable: { page: 0, size: 2000 } });

  const { data, isLoading } = useQuery({
    queryKey: ['getBills', pagination.current, pagination.pageSize, filters],
    queryFn: () => getBills({
      billDate: filters.billDate,
      repId: filters.repId,
      shopId: filters.shopId,
      status: filters.status,
      search: filters.search,
      page: pagination.current - 1,
      size: pagination.pageSize,
      sort: ['id,desc']
    }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelBill(id),
    onSuccess: () => {
      notification.success({ message: 'Success', description: 'Bill cancelled successfully' });
      queryClient.invalidateQueries({ queryKey: ['getBills'] });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to cancel bill',
      });
    },
  });

  const showCancelConfirm = (id: number | undefined, billNumber: string | undefined) => {
    if (!id || !billNumber) return;
    Modal.confirm({
      title: 'Are you sure you want to cancel this bill?',
      icon: <ExclamationCircleOutlined />,
      content: `Bill: ${billNumber}. This action will revert any shop loan balances updated by this bill.`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        cancelMutation.mutate(id);
      },
    });
  };

  const handleCollectClick = (bill: BillResponse) => {
    setSelectedBill(bill);
    setCollectionModalOpen(true);
  };

  const getStatusTag = (status?: string) => {
    switch (status) {
      case 'COLLECTED': return <Tag color="green" icon={<CheckCircleOutlined />}>Collected</Tag>;
      case 'PENDING': return <Tag color="gold" icon={<InfoCircleOutlined />}>Pending</Tag>;
      case 'CANCELLED': return <Tag color="red" icon={<DeleteOutlined />}>Cancelled</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'billDate',
      key: 'billDate',
      width: 120,
    },
    {
      title: 'Bill No.',
      dataIndex: 'billNumber',
      key: 'billNumber',
      width: 120,
    },
    {
      title: 'Rep',
      dataIndex: 'repName',
      key: 'repName',
      width: 150,
    },
    {
      title: 'Shop',
      dataIndex: 'shopName',
      key: 'shopName',
      width: 150,
    },
    {
      title: 'Final Total',
      dataIndex: 'finalTotal',
      key: 'finalTotal',
      render: (val: number) => <Text strong>Rs {val.toFixed(2)}</Text>,
      width: 120,
      align: 'right' as const,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
      width: 120,
    },
    {
      title: 'Action',
      key: 'action',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, record: BillResponse) => (
        <Space size="middle">
          {record.status === 'PENDING' && (
            <div className="flex gap-2">
              <Button 
                type="primary" 
                size="small" 
                icon={<DollarOutlined />}
                onClick={() => handleCollectClick(record)}
              >
                Collect
              </Button>
              <Button 
                size="small" 
                onClick={() => {
                  setSelectedBill(record);
                  setDrawerOpen(true);
                }}
              >
                Edit
              </Button>
            </div>
          )}
          {record.status !== 'CANCELLED' && (
            <Button 
              danger 
              size="small" 
              icon={<DeleteOutlined />} 
              onClick={() => showCancelConfirm(record.id, record.billNumber)}
            >
              Cancel
            </Button>
          )}
        </Space>
      ),
      width: 180,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Bills"
        subtitle="Manage shop bills and collections"
        extra={[
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => {
            setSelectedBill(null);
            setDrawerOpen(true);
          }}>
            Create Bill
          </Button>
        ]}
      />

      <div style={{ marginBottom: 16, background: '#fff', padding: 16, borderRadius: 8 }}>
        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Input.Search
              placeholder="Search Bill No."
              allowClear
              onSearch={val => setFilters(prev => ({ ...prev, search: val || undefined }))}
            />
          </Col>
          <Col span={4}>
            <DatePicker
              placeholder="Bill Date"
              style={{ width: '100%' }}
              allowClear
              onChange={date => setFilters(prev => ({ ...prev, billDate: date ? date.format('YYYY-MM-DD') : undefined }))}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by Rep"
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp="children"
              loading={repsLoading}
              onChange={val => setFilters(prev => ({ ...prev, repId: val || undefined }))}
            >
              {repsData?.content?.map(rep => <Select.Option key={rep.id} value={rep.id}>{rep.name}</Select.Option>)}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by Shop"
              style={{ width: '100%' }}
              allowClear
              showSearch
              loading={shopsLoading}
              onChange={val => setFilters(prev => ({ ...prev, shopId: val || undefined }))}
              filterOption={(input, option) => {
                const label = String(option?.label ?? '');
                return label.toLowerCase().includes(input.toLowerCase());
              }}
              options={shopsData?.content?.map(shop => ({
                value: shop.id,
                label: shop.outletId
                  ? `${shop.name} (${shop.outletId})`
                  : shop.name ?? '',
              }))}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              allowClear
              onChange={val => setFilters(prev => ({ ...prev, status: val || undefined }))}
            >
              <Select.Option value="PENDING">Pending</Select.Option>
              <Select.Option value="COLLECTED">Collected</Select.Option>
              <Select.Option value="CANCELLED">Cancelled</Select.Option>
            </Select>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={data?.content}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: data?.totalElements || 0,
          showSizeChanger: true,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
        }}
        scroll={{ x: 1000 }}
      />

      <BillFormDrawer 
        open={drawerOpen} 
        billId={selectedBill && !collectionModalOpen ? selectedBill.id : undefined}
        onClose={() => {
          setDrawerOpen(false);
          if (!collectionModalOpen) {
            setSelectedBill(null);
          }
        }} 
      />

      <BillCollectionModal
        open={collectionModalOpen}
        onClose={() => {
          setCollectionModalOpen(false);
          setSelectedBill(null);
        }}
        bill={selectedBill}
      />
    </div>
  );
}
