import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Tag, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageLayout, PageHeader, DataTable, ListPageFooter } from '@/components/common';
import { getMorningSummaries } from '../api/morningSummaryApi';
import type { MorningSummary } from '../types';
import { MorningSummaryFormDrawer } from '../components/MorningSummaryFormDrawer';
import { DeductInventoryModal } from '../components/DeductInventoryModal';
import { useTableState } from '@/hooks/useTableState';
import { undoDeduction } from '../api/morningSummaryApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const MorningSummariesPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deductModalOpen, setDeductModalOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<MorningSummary | null>(null);
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
    queryKey: ['morningSummaries', pageableParams],
    queryFn: () => getMorningSummaries(tableState.page, tableState.size),
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
      width: 120,
      render: (_, record) => {
        if (record.status === 'PENDING') {
          return (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setSelectedSummary(record);
                setDeductModalOpen(true);
              }}
            >
              Deduct
            </Button>
          );
        }
        if (record.status === 'SETTLED') {
          return (
            <Button
              danger
              size="small"
              loading={undoMutation.isPending && undoMutation.variables === record.id}
              onClick={() => {
                Modal.confirm({
                  title: 'Undo Deduction',
                  content: `Are you sure you want to reverse this deduction and return stock to ${record.deductedWarehouseName || 'the warehouse'}?`,
                  onOk: () => undoMutation.mutate(record.id),
                });
              }}
            >
              Undo
            </Button>
          );
        }
        return null;
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
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawerOpen(true)}
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
        onClose={() => setDrawerOpen(false)} 
      />

      <DeductInventoryModal
        open={deductModalOpen}
        onClose={() => {
          setDeductModalOpen(false);
          setSelectedSummary(null);
        }}
        summary={selectedSummary}
      />
    </PageLayout>
  );
};
