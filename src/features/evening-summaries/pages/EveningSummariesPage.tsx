import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Tag, Modal, notification, DatePicker, Space, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { PlusOutlined, MoreOutlined, EyeOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, UndoOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { PageLayout, PageHeader, DataTable, ListPageFooter } from '@/components/common';
import { getEveningSummaries, deleteEveningSummary, undoProceedEveningSummary, type EveningSummaryResponse } from '../api/eveningSummaryApi';
import { EveningSummaryFormDrawer } from '../components/EveningSummaryFormDrawer';
import { ProceedWithStockCheckModal } from '../components/ProceedWithStockCheckModal';
import { EveningSummaryViewDrawer } from '../components/EveningSummaryViewDrawer';
import { useTableState } from '@/hooks/useTableState';
import { useAuthStore } from '@/store/authStore';

export const EveningSummariesPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [proceedModalOpen, setProceedModalOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedSummaryId, setSelectedSummaryId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(30, 'day'), dayjs()]);
  const queryClient = useQueryClient();

  const user = useAuthStore(state => state.user);
  const roles = (user as { roles?: string[] })?.roles || [];
  const canEdit = roles.some((role: string) => ['TENANT_OWNER', 'DATA_ENTRY'].includes(role));

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
    queryKey: ['evening-summaries', pageableParams, dateRange?.[0]?.format('YYYY-MM-DD'), dateRange?.[1]?.format('YYYY-MM-DD')],
    queryFn: () => getEveningSummaries({
      page: tableState.page,
      size: tableState.size,
      sort: [`${tableState.sort},${tableState.dir}`],
      search: tableState.search || undefined,
      startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
    }),
  });

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Delete Evening Summary',
      content: 'Are you sure you want to delete this evening summary?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteEveningSummary(id);
          notification.success({ message: 'Summary deleted successfully' });
          queryClient.invalidateQueries({ queryKey: ['evening-summaries'] });
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } }, message?: string };
          notification.error({
            message: 'Error deleting summary',
            description: err.response?.data?.message || err.message || 'An unknown error occurred.',
          });
        }
      },
    });
  };

  const handleUndoProceed = (id: number) => {
    Modal.confirm({
      title: 'Undo Proceed Action?',
      content: 'This will reverse the inventory deduction and put the stock back into the warehouse. The summary will revert to PENDING status.',
      okText: 'Confirm Undo',
      okType: 'danger',
      onOk: async () => {
        try {
          await undoProceedEveningSummary(id);
          notification.success({ message: 'Proceed action reversed successfully' });
          queryClient.invalidateQueries({ queryKey: ['evening-summaries'] });
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } }, message?: string };
          notification.error({
            message: 'Error reversing proceed',
            description: err.response?.data?.message || err.message || 'An unknown error occurred.',
          });
        }
      },
    });
  };

  const columns: ColumnsType<EveningSummaryResponse> = [
    {
      title: 'Summary No.',
      dataIndex: 'summaryNumber',
      key: 'summaryNumber',
      sorter: true,
      width: 150,
      render: (text) => <span style={{ fontWeight: 600, color: '#1890ff' }}>{text}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'summaryDate',
      key: 'summaryDate',
      sorter: true,
      render: (date: string) => dayjs(date).format('MMMM D, YYYY'),
    },
    {
      title: 'Rep',
      dataIndex: 'repName',
      key: 'repName',
      sorter: true,
    },
    {
      title: 'Driver',
      dataIndex: 'driverName',
      key: 'driverName',
      sorter: true,
    },
    {
      title: 'Total Value',
      dataIndex: 'finalEstimateValue',
      key: 'finalEstimateValue',
      align: 'right',
      render: (val: number) => `LKR ${new Intl.NumberFormat('en-LK').format(val)}`,
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center',
      render: (_, record: EveningSummaryResponse) => (
        <Space direction="vertical" size={2}>
          <Tag color={record.status === 'SETTLED' ? 'success' : 'processing'}>
            {record.status}
          </Tag>
          {record.inventoryProcessed && (
            <Tag color="green" style={{ margin: 0 }}>Processed</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record: EveningSummaryResponse) => {
        const items: MenuProps['items'] = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'View Details',
            onClick: () => {
              setSelectedSummaryId(record.id);
              setViewDrawerOpen(true);
            },
          },
        ];

        if (canEdit && record.status === 'PENDING' && !record.inventoryProcessed) {
          items.push({
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => {
              setSelectedSummaryId(record.id);
              setDrawerOpen(true);
            },
          });
          items.push({ type: 'divider' });
          items.push({
            key: 'proceed',
            icon: <PlayCircleOutlined style={{ color: '#1890ff' }} />,
            label: <span style={{ color: '#1890ff', fontWeight: 500 }}>Proceed (Check Stock)</span>,
            onClick: () => {
              setSelectedSummaryId(record.id);
              setProceedModalOpen(true);
            },
          });
          items.push({ type: 'divider' });
          items.push({
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDelete(record.id),
          });
        }

        if (canEdit && record.inventoryProcessed && record.status === 'PENDING') {
          items.push({ type: 'divider' });
          items.push({
            key: 'undo',
            icon: <UndoOutlined />,
            label: 'Undo Proceed',
            danger: true,
            onClick: () => handleUndoProceed(record.id),
          });
        }

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <PageLayout>
      <PageHeader
        title="Evening Summaries"
        subtitle="Manage end-of-day stock deductions and rep settlements."
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
              setSelectedSummaryId(null);
              setDrawerOpen(true);
            }}
          >
            Create Summary
          </Button>
        ].filter(Boolean)}
      />

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex-grow flex flex-col">
        <DataTable
          columns={columns}
          dataSource={data?.content || []}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          scroll={{ x: 800, y: 'calc(100vh - 350px)' }}
          onChange={(_, __, sorter: unknown) => {
            const s = (Array.isArray(sorter) ? sorter[0] : sorter) as { field?: string, order?: string };
            if (s && s.field && s.order) {
              setSort(s.field, s.order === 'ascend' ? 'asc' : 'desc');
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

      <EveningSummaryFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        summaryId={selectedSummaryId}
      />

      <EveningSummaryViewDrawer
        open={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        summaryId={selectedSummaryId}
      />

      <ProceedWithStockCheckModal
        open={proceedModalOpen}
        onClose={() => setProceedModalOpen(false)}
        summaryId={selectedSummaryId!}
      />
    </PageLayout>
  );
};
