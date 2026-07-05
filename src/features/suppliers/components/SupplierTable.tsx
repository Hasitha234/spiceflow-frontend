import React, { useState } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, ShoppingOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { DataTable, ConfirmDeleteDialog, PermissionGuard } from '@/components/common';
import type { SupplierResponse } from '@/api/generated';
import { useDeleteSupplier } from '../hooks/useDeleteSupplier';
import type { TableState } from '@/hooks/useTableState';

export interface SupplierTableProps {
  data: SupplierResponse[];
  total: number;
  loading: boolean;
  tableState: TableState;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  onSortChange: (field: string, dir: 'asc' | 'desc') => void;
  onEdit: (supplier: SupplierResponse) => void;
  onViewCatalog?: (supplier: SupplierResponse) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({
  data,
  total,
  loading,
  tableState,
  onPageChange,
  onSizeChange,
  onSortChange,
  onEdit,
  onViewCatalog,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<SupplierResponse | null>(null);
  const deleteMutation = useDeleteSupplier({
    onSuccess: () => setDeleteTarget(null),
  });

  const columns: ColumnsType<SupplierResponse> = [
    {
      title: 'Supplier Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (name: string) => (
        <span className="font-medium text-slate-100">{name}</span>
      ),
    },
    {
      title: 'Tax ID',
      dataIndex: 'taxId',
      key: 'taxId',
      width: 150,
      render: (taxId?: string) => (
        <span className="font-mono text-emerald-400 text-sm">{taxId || '—'}</span>
      ),
    },
    {
      title: 'Contact Email',
      dataIndex: 'contactEmail',
      key: 'contactEmail',
      width: 200,
      ellipsis: true,
      render: (email?: string) => (
        <span className="text-slate-300">{email || '—'}</span>
      ),
    },
    {
      title: 'Contact Phone',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 150,
      render: (phone?: string) => (
        <span className="text-slate-300">{phone || '—'}</span>
      ),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (address?: string) => (
        <span className="text-slate-400">{address || '—'}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: SupplierResponse) => (
        <Space size="small">
          <Tooltip title="View Catalog & Items">
            <Button
              type="text"
              size="small"
              icon={<ShoppingOutlined />}
              onClick={() => onViewCatalog?.(record)}
              className="!text-emerald-400 hover:!text-emerald-300"
            />
          </Tooltip>
          <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_PURCHASING_AGENT', 'ROLE_INVENTORY_MANAGER']}>
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
    sorter: SorterResult<SupplierResponse> | SorterResult<SupplierResponse>[],
  ) => {
    // Pagination
    if (pagination.current !== undefined) {
      onPageChange((pagination.current ?? 1) - 1);
    }
    if (pagination.pageSize !== undefined) {
      onSizeChange(pagination.pageSize);
    }

    // Sorting
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
      <DataTable<SupplierResponse>
        dataSource={data}
        columns={columns}
        rowKey="id"
        isLoading={loading}
        emptyTitle="No suppliers found"
        emptyDescription="Create your first supplier to start managing sourcing and procurement."
        pagination={{
          current: tableState.page + 1,
          pageSize: tableState.size,
          total,
          showSizeChanger: true,
          showTotal: (t, range) => `${range[0]}–${range[1]} of ${t} suppliers`,
        }}
        onChange={handleTableChange as never}
        scroll={{ x: 900 }}
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
