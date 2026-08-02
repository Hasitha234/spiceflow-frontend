import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Tag, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageLayout, PageHeader, DataTable, ListPageFooter } from '@/components/common';
import { getCancelSummaries } from '@/api/generated';
import type { CancelSummaryResponse } from '@/api/generated';
import { CancelSummaryFormDrawer } from '../components/CancelSummaryFormDrawer';
import { ReturnToWarehouseModal } from '../components/ReturnToWarehouseModal';
import { undoProceedCancelSummary } from '../api/cancelSummaryApi';
import { useTableState } from '@/hooks/useTableState';

export const CancelSummariesPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [proceedModalOpen, setProceedModalOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<CancelSummaryResponse | null>(null);
  const queryClient = useQueryClient();

  const {
    state: tableState,
    pageableParams,
    setPage,
    setSize,
    setSort,
  } = useTableState({
    defaultSort: 'id',
    defaultDir: 'desc',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['cancelSummaries', pageableParams],
    queryFn: () => getCancelSummaries({ page: tableState.page, size: tableState.size, sort: [`${tableState.sort},${tableState.dir}`] }),
  });

  const columns: ColumnsType<CancelSummaryResponse> = [
    {
      title: 'Summary No',
      dataIndex: 'summaryNumber',
      key: 'summaryNumber',
      render: (text) => <span className="font-semibold text-orange-600">{text}</span>,
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
      title: 'Ret. Value',
      dataIndex: 'finalEstimateValue',
      key: 'finalEstimateValue',
      render: (val) => (
        <span className="font-bold text-orange-700">
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
            <div className="flex gap-2">
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  setSelectedSummary(record);
                  setProceedModalOpen(true);
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
            </div>
          );
        }
        if (record.status === 'SETTLED') {
          return (
            <Button
              danger
              size="small"
              loading={undoMutation.isPending && undoMutation.variables === record.id}
              onClick={() => {
                if (record.id) {
                  Modal.confirm({
                    title: 'Undo Proceed',
                    content: `Are you sure you want to reverse this summary and remove stock from ${record.returnWarehouseName || 'the warehouse'}?`,
                    onOk: () => undoMutation.mutate(record.id as number),
                  });
                }
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
    mutationFn: (id: number) => undoProceedCancelSummary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cancelSummaries'] });
    },
  });

  return (
    <PageLayout>
      <PageHeader
        title="Cancel Summaries"
        subtitle="Manage end of day unsold stock and returns from van sales."
        extra={[
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

      <CancelSummaryFormDrawer 
        open={drawerOpen} 
        summaryId={selectedSummary && !proceedModalOpen ? selectedSummary.id : undefined}
        onClose={() => {
          setDrawerOpen(false);
          if (!proceedModalOpen) {
            setSelectedSummary(null);
          }
        }} 
      />

      <ReturnToWarehouseModal
        open={proceedModalOpen}
        onClose={() => {
          setProceedModalOpen(false);
          setSelectedSummary(null);
        }}
        summary={selectedSummary}
      />
    </PageLayout>
  );
};
