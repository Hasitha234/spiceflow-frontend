import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tag, DatePicker, Select, Space } from 'antd';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { PageLayout, PageHeader, DataTable, ListPageFooter } from '@/components/common';
import { useTableState } from '@/hooks/useTableState';
import { stockTransferApi, type TransferHistoryResponse } from '../api/stockTransferApi';
import { warehouseApi } from '@/api/inventory';
import type { Warehouse } from '@/types/inventory';

export const StockTransfersPage = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);

  const {
    state: tableState,
    pageableParams,
    setPage,
    setSize,
  } = useTableState({
    defaultSort: 'timestamp',
    defaultDir: 'desc',
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses', 'all'],
    queryFn: () => warehouseApi.list({ size: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      'stock-transfers',
      pageableParams,
      dateRange?.[0]?.toISOString(),
      dateRange?.[1]?.toISOString(),
      selectedWarehouse
    ],
    queryFn: () =>
      stockTransferApi.listTransfers({
        page: tableState.page,
        size: tableState.size,
        startDate: dateRange?.[0]?.startOf('day').toISOString(),
        endDate: dateRange?.[1]?.endOf('day').toISOString(),
        warehouseId: selectedWarehouse || undefined,
      }),
  });

  const columns: ColumnsType<TransferHistoryResponse> = [
    {
      title: 'Date & Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (text) => dayjs(text).format('DD MMM YYYY, HH:mm'),
    },
    {
      title: 'Reference No.',
      dataIndex: 'referenceId',
      key: 'referenceId',
      width: 140,
      render: (text) => <span style={{ fontWeight: 600, color: '#1890ff' }}>{text}</span>,
    },
    {
      title: 'Product',
      key: 'product',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{record.productName}</span>
          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.productSku}</span>
        </Space>
      ),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 160,
    },
    {
      title: 'Direction',
      dataIndex: 'movementType',
      key: 'movementType',
      width: 120,
      render: (type: string) => {
        const isOut = type === 'TRANSFER_OUT';
        return (
          <Tag color={isOut ? 'orange' : 'green'} style={{ minWidth: '70px', textAlign: 'center' }}>
            {isOut ? 'OUT' : 'IN'}
          </Tag>
        );
      },
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'right',
      render: (qty: number, record) => {
        const isOut = record.movementType === 'TRANSFER_OUT';
        const color = isOut ? '#faad14' : '#52c41a';
        const displayQty = Math.abs(qty);
        return <span style={{ color, fontWeight: 600 }}>{isOut ? '-' : '+'}{displayQty}</span>;
      },
    },
    {
      title: 'Performed By',
      dataIndex: 'performedBy',
      key: 'performedBy',
      width: 150,
    },
  ];

  return (
    <PageLayout>
      <PageHeader
        title="Stock Transfers"
        subtitle="View history of all stock transfers between warehouses"
        extra={[
          <Select
            key="warehouse-filter"
            placeholder="All Warehouses"
            allowClear
            style={{ width: 200 }}
            value={selectedWarehouse}
            onChange={setSelectedWarehouse}
            options={warehouses?.content?.map((w: Warehouse) => ({
              label: w.name,
              value: w.id,
            }))}
          />,
          <DatePicker.RangePicker
            key="date-range"
            value={dateRange}
            onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])}
            allowClear={false}
          />,
        ]}
      />

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }}>
        <DataTable
          columns={columns}
          dataSource={data?.content || []}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          size="middle"
        />
      </div>

      <ListPageFooter
        totalCount={data?.totalElements || 0}
        pageSize={tableState.size}
        currentPage={tableState.page + 1}
        itemNameSingular="Transfer"
        onPageChange={(page, size) => {
          setPage(page - 1);
          setSize(size);
        }}
      />
    </PageLayout>
  );
};
