import React, { useState } from 'react';
import { Button, Space, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { DataTable, ConfirmDeleteDialog, PermissionGuard, ListPageFooter, TruncatedCell } from '@/components/common';
import type { ProductResponse } from '@/api/generated';
import { useDeleteProduct } from '../hooks/useDeleteProduct';
import type { TableState } from '@/hooks/useTableState';

export interface ProductTableProps {
  data: ProductResponse[];
  total: number;
  loading: boolean;
  tableState: TableState;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  onSortChange: (field: string, dir: 'asc' | 'desc') => void;
  onEdit: (product: ProductResponse) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  data,
  total,
  loading,
  tableState,
  onPageChange,
  onSizeChange,
  onSortChange,
  onEdit,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<ProductResponse | null>(null);
  const deleteMutation = useDeleteProduct({
    onSuccess: () => setDeleteTarget(null),
  });

  const columns: ColumnsType<ProductResponse> = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      sorter: true,
      width: 120,
      render: (sku: string) => (
        <span className="font-mono text-emerald-400 text-sm">{sku}</span>
      ),
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (name: string) => (
        // Fixed: added tooltip to TruncatedCell for Product Name column (Item 3)
        <TruncatedCell value={name} className="font-medium !text-slate-100" />
      ),
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 160,
      render: (cat: string) => (
        <Tag className="!bg-blue-950/60 !border-blue-700/50 !text-blue-300 rounded-md">
          {cat ?? '—'}
        </Tag>
      ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
      width: 160,
      render: (supplierName: string) => (
        // Fixed: Supplier column already uses TruncatedCell which provides the tooltip (Item 3)
        <TruncatedCell value={supplierName} />
      ),
    },
    {
      title: 'Unit Type',
      dataIndex: 'unitType',
      key: 'unitType',
      width: 100,
      render: (type: string) => (
        <Tag className="!bg-slate-800 !border-slate-700 !text-slate-300 rounded-md">
          {type}
        </Tag>
      ),
    },
    {
      title: 'Rate / Bundle',
      dataIndex: 'ratePerSoldUnit',
      key: 'ratePerSoldUnit',
      sorter: true,
      width: 130,
      align: 'right' as const,
      render: (rate: number) =>
        rate != null ? (
          <span className="tabular-nums font-medium text-slate-200">
            LKR {rate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        ) : (
          <span className="text-slate-500">—</span>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: ProductResponse) => (
        <Space size="small">
          <PermissionGuard requirePermission="SETTINGS_PRODUCTS">
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
    _pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<ProductResponse> | SorterResult<ProductResponse>[],
  ) => {
    // Pagination is handled by ListPageFooter now

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
      <DataTable<ProductResponse>
        dataSource={data}
        columns={columns}
        rowKey="id"
        isLoading={loading}
        emptyTitle="No products found"
        emptyDescription="Create your first product to get started with inventory management."
        pagination={false}
        onChange={handleTableChange as never}
        scroll={{ x: 900 }}
      />

      {total > 0 && (
        <ListPageFooter
          totalCount={total}
          pageSize={tableState.size}
          currentPage={tableState.page + 1}
          itemNameSingular="product"
          onPageChange={(page, size) => {
            onPageChange(page - 1);
            onSizeChange(size);
          }}
        />
      )}

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
