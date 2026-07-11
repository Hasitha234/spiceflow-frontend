import React, { useState } from 'react';
import { Button, Space, Tooltip, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { DataTable, ConfirmDeleteDialog, PermissionGuard } from '@/components/common';
import type { ShopResponse } from '@/api/generated';
import { useDeleteShop } from '../hooks/useDeleteShop';
import type { TableState } from '@/hooks/useTableState';

export interface ShopTableProps {
  data: ShopResponse[];
  total: number;
  loading: boolean;
  tableState: TableState;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  onSortChange: (field: string, dir: 'asc' | 'desc') => void;
  onEdit: (shop: ShopResponse) => void;
}

export const ShopTable: React.FC<ShopTableProps> = ({
  data,
  total,
  loading,
  tableState,
  onPageChange,
  onSizeChange,
  onSortChange,
  onEdit,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<ShopResponse | null>(null);
  const deleteMutation = useDeleteShop({
    onSuccess: () => setDeleteTarget(null),
  });

  const columns: ColumnsType<ShopResponse> = [
    {
      title: 'Shop Details',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      width: 250,
      ellipsis: true,
      render: (name: string, record: ShopResponse) => (
        <div>
          <div className="font-medium text-slate-900">{name}</div>
          {record.ownerName && (
            <div className="text-sm text-slate-500">Owner: {record.ownerName}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Route & Area',
      key: 'routeArea',
      render: (_: unknown, record: ShopResponse) => (
        <div>
          <div className="font-medium text-slate-900">{record.route || 'No Route'}</div>
          <div className="text-sm text-slate-500">{record.area || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone?: string) => (
        <span className="text-slate-300 font-mono text-sm">{phone || '—'}</span>
      ),
    },
    {
      title: 'Assigned Rep',
      dataIndex: 'assignedRepName',
      key: 'assignedRepName',
      width: 160,
      render: (repName?: string) => (
        <Tag className="bg-slate-800 border-slate-700 text-slate-300 m-0">
          {repName || 'Unassigned'}
        </Tag>
      ),
    },
    {
      title: 'Outstanding Loan',
      dataIndex: 'outstandingLoan',
      key: 'outstandingLoan',
      width: 160,
      align: 'right',
      render: (loan?: number) => (
        <span className={`font-mono font-medium ${loan && loan > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
          LKR {(loan ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: 'GPS',
      key: 'gps',
      width: 110,
      align: 'center',
      render: (_: unknown, record: ShopResponse) => {
        if (record.latitude && record.longitude) {
          return (
            <Tooltip title={`${record.latitude}, ${record.longitude}`}>
              <Tag color="success" className="m-0 cursor-help">
                <EnvironmentOutlined className="mr-1" />
                Set
              </Tag>
            </Tooltip>
          );
        }
        return <span className="text-slate-500 text-xs">Unset</span>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      align: 'center',
      render: (active?: boolean) => (
        <Tag color={active ? 'emerald' : 'default'} className="m-0">
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      fixed: 'right' as const,
      render: (_: unknown, record: ShopResponse) => (
        <Space size="small">
          <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_SALES_MANAGER', 'ROLE_SALES_REP']}>
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                className="text-slate-400 hover:text-emerald-500 transition-colors"
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => setDeleteTarget(record)}
                className="text-slate-400 hover:text-red-500 transition-colors"
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
    sorter: SorterResult<ShopResponse> | SorterResult<ShopResponse>[],
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
      <DataTable<ShopResponse>
        dataSource={data}
        columns={columns}
        rowKey="id"
        isLoading={loading}
        emptyTitle="No shops found"
        emptyDescription="Register your first retail shop or customer location."
        pagination={{
          current: tableState.page + 1,
          pageSize: tableState.size,
          total,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}–${range[1]} of ${t} shop${t === 1 ? '' : 's'}`,
        }}
        onChange={handleTableChange as never}
        scroll={{ x: 'max-content' }}
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
