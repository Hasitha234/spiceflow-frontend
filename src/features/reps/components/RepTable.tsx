import React, { useState } from 'react';
import { Button, Space, Tooltip, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { DataTable, ConfirmDeleteDialog, PermissionGuard } from '@/components/common';
import type { RepResponse } from '@/api/generated';
import { useDeleteRep } from '../hooks/useDeleteRep';
import type { TableState } from '@/hooks/useTableState';

export interface RepTableProps {
  data: RepResponse[];
  total: number;
  loading: boolean;
  tableState: TableState;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  onSortChange: (field: string, dir: 'asc' | 'desc') => void;
  onEdit: (rep: RepResponse) => void;
}

export const RepTable: React.FC<RepTableProps> = ({
  data,
  total,
  loading,
  tableState,
  onPageChange,
  onSizeChange,
  onSortChange,
  onEdit,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<RepResponse | null>(null);
  const deleteMutation = useDeleteRep({
    onSuccess: () => setDeleteTarget(null),
  });

  const columns: ColumnsType<RepResponse> = [
    {
      title: 'Rep Details',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (name: string, record: RepResponse) => (
        <div>
          <div className="font-semibold text-slate-100">{name}</div>
          {record.employeeId && (
            <div className="text-xs text-slate-400 font-mono">ID: {record.employeeId}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Contact Info',
      key: 'contact',
      width: 220,
      render: (_: unknown, record: RepResponse) => (
        <div>
          {record.email && <div className="text-slate-300 text-sm">{record.email}</div>}
          <div className="text-xs text-slate-400 font-mono">{record.phone || 'No phone'}</div>
        </div>
      ),
    },
    {
      title: 'Area / Territory',
      dataIndex: 'area',
      key: 'area',
      width: 180,
      render: (area?: string) => (
        <span className="text-slate-300 font-medium">{area || '—'}</span>
      ),
    },
    {
      title: 'Assigned Shops',
      dataIndex: 'assignedShopsCount',
      key: 'assignedShopsCount',
      width: 140,
      align: 'center',
      render: (count?: number) => (
        <Tag color="blue" className="font-mono m-0 px-2.5 py-0.5 rounded-full text-xs">
          {count ?? 0} Shops
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'} className="m-0">
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      align: 'right',
      render: (_: unknown, record: RepResponse) => (
        <Space size="small">
          <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_SALES_MANAGER']}>
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                className="!text-blue-400 hover:!text-blue-300"
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => setDeleteTarget(record)}
              />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<RepResponse> | SorterResult<RepResponse>[]
  ) => {
    if (pagination.current !== undefined) {
      onPageChange((pagination.current ?? 1) - 1);
    }
    if (pagination.pageSize !== undefined) {
      onSizeChange(pagination.pageSize);
    }
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    if (singleSorter?.field) {
      onSortChange(
        singleSorter.field as string,
        singleSorter.order === 'ascend' ? 'asc' : 'desc',
      );
    }
  };

  return (
    <>
      <DataTable<RepResponse>
        columns={columns}
        dataSource={data}
        rowKey="id"
        isLoading={loading}
        emptyTitle="No sales representatives found"
        emptyDescription="Register your first field sales agent."
        pagination={{
          current: tableState.page + 1,
          pageSize: tableState.size,
          total,
          showSizeChanger: true,
          showTotal: (totalCount) => `Total ${totalCount} reps`,
        }}
        onChange={handleTableChange as never}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        entityName={deleteTarget?.name}
        confirmLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget?.id) {
            deleteMutation.mutate({ id: deleteTarget.id });
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};
