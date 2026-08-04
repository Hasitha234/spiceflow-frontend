import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Tag, Modal, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { PageLayout, PageHeader, DataTable, ListPageFooter } from '@/components/common';
import { getMorningSummaries } from '../api/morningSummaryApi';
import type { MorningSummary } from '../types';
import { MorningSummaryFormDrawer } from '../components/MorningSummaryFormDrawer';
import { DeductInventoryModal } from '../components/DeductInventoryModal';
import { useTableState } from '@/hooks/useTableState';
import { undoDeduction } from '../api/morningSummaryApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MorningSummaryViewDrawer } from '../components/MorningSummaryViewDrawer';

export const MorningSummariesPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deductModalOpen, setDeductModalOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<MorningSummary | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().startOf('month'), dayjs().endOf('month')]);
  const queryClient = useQueryClient();

  const {
    state: tableState,
    pageableParams,
    setPage,
    setSize,
    setSort,
  } = useTableState({
    defaultSort: 'createdAt',
    defaultDir: 'desc',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['morningSummaries', pageableParams, dateRange?.[0]?.format('YYYY-MM-DD'), dateRange?.[1]?.format('YYYY-MM-DD')],
    queryFn: () => getMorningSummaries(tableState.page, tableState.size, dateRange?.[0]?.format('YYYY-MM-DD'), dateRange?.[1]?.format('YYYY-MM-DD')),
  });

  const columns: ColumnsType<MorningSummary> = [
    {
      title: 'Summary No',
      dataIndex: 'summaryNumber',
      key: 'summaryNumber',
      render: (text) => <span className="font-semibold text-blue-600">{text}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'summaryDate',
      key: 'summaryDate',
      render: (date) => <span>{new Date(date).toLocaleDateString()}</span>,
    },
    {
      title: 'Rep Name',
      dataIndex: 'repName',
      key: 'repName',
    },
    {
      title: 'Driver Name',
      dataIndex: 'driverName',
      key: 'driverName',
    },
    {
      title: 'Est. Value',
      dataIndex: 'finalEstimateValue',
      key: 'finalEstimateValue',
      render: (val) => (
        <span className="font-bold text-green-700">
          {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(val)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'SETTLED') color = 'success';
        if (status === 'CANCELLED') color = 'error';
        if (status === 'PENDING') color = 'processing';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => {
        return (
          <div className="flex gap-2">
            <Button
              size="small"
              onClick={() => {
                setSelectedSummary(record);
                setViewDrawerOpen(true);
              }}
            >
              View
            </Button>
            {record.status === 'PENDING' && (
              <>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => {
                    setSelectedSummary(record);
                    setDeductModalOpen(true);
                  }}
                >
                  Proceed
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedSummary(record);
                    setDrawerOpen(true);
                  }}
                >
                  Edit
                </Button>
              </>
            )}
            {record.status === 'SETTLED' && (
              <Button
                danger
                size="small"
                loading={undoMutation.isPending && undoMutation.variables === record.id}
                onClick={() => {
                  Modal.confirm({
                    title: 'Undo Deduction',
                    content: `Are you sure you want to reverse this summary and return stock to ${record.deductedWarehouseName || 'the warehouse'} and subtract from ${record.returnWarehouseName || 'the return warehouse'}?`,
                    onOk: () => undoMutation.mutate(record.id),
                  });
                }}
              >
                Undo
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const undoMutation = useMutation({
    mutationFn: (id: number) => undoDeduction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morningSummaries'] });
    },
  });

  return (
    <PageLayout>
      <PageHeader
        title="Morning Summaries"
        subtitle="Manage bulk van sales dispatch and load estimates."
        extra={[
          <DatePicker.RangePicker
            key="dateRange"
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
                setPage(0);
              }
            }}
            format="YYYY-MM-DD"
          />,
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedSummary(null);
              setDrawerOpen(true);
            }}
          >
            Create Summary
          </Button>,
        ]}
      />

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex-grow flex flex-col">
        <DataTable
          columns={columns}
          dataSource={data?.content || []}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          scroll={{ x: 800, y: 'calc(100vh - 350px)' }}
          onChange={(_, __, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            if (s && s.field && s.order) {
              setSort(s.field as string, s.order === 'ascend' ? 'asc' : 'desc');
            }
          }}
        />
        
        <ListPageFooter
          totalCount={data?.totalElements || 0}
          currentPage={tableState.page + 1}
          pageSize={tableState.size}
          itemNameSingular="summary"
          onPageChange={(page, size) => {
            setPage(page - 1);
            setSize(size);
          }}
        />
      </div>

      <MorningSummaryFormDrawer 
        open={drawerOpen} 
        summaryId={selectedSummary && !deductModalOpen ? selectedSummary.id : undefined}
        onClose={() => {
          setDrawerOpen(false);
          if (!deductModalOpen) {
            setSelectedSummary(null);
          }
        }} 
      />

      <DeductInventoryModal
        open={deductModalOpen}
        onClose={() => {
          setDeductModalOpen(false);
          setSelectedSummary(null);
        }}
        summary={selectedSummary}
      />
      
      <MorningSummaryViewDrawer
        open={viewDrawerOpen}
        onClose={() => {
          setViewDrawerOpen(false);
          setSelectedSummary(null);
        }}
        summary={selectedSummary}
      />
    </PageLayout>
  );
};
