import React, { useState } from 'react';
import { Button, Space, Tooltip, Tag, message } from 'antd';
import { EditOutlined, DeleteOutlined, EnvironmentOutlined, QrcodeOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { DataTable, ConfirmDeleteDialog, PermissionGuard } from '@/components/common';
import { qrApi } from '@/api/sales';
import type { ShopResponse } from '@/api/generated';
import { useDeleteShop } from '../hooks/useDeleteShop';
import type { TableState } from '@/hooks/useTableState';
import { ShopQrModal } from './ShopQrModal';

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
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<ShopResponse | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShopResponse | null>(null);

  const handleShowQr = async (shop: ShopResponse) => {
    try {
      if (shop.id) {
        const res = await qrApi.getShopQr(shop.id);
        setQrPayload(res.qrPayload);
        setSelectedShop(shop);
        setQrModalOpen(true);
      }
    } catch {
      message.error('Failed to load QR code for this shop');
    }
  };

  const deleteMutation = useDeleteShop({
    onSuccess: () => setDeleteTarget(null),
  });

  const columns: ColumnsType<ShopResponse> = [
    {
      title: 'Shop Details',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      ellipsis: true,
      render: (name: string, record: ShopResponse) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{name}</span>
            {!record.isActive && (
              <Tag color="default" className="m-0" style={{ fontSize: 'var(--text-xs)' }}>Inactive</Tag>
            )}
            {record.latitude && record.longitude && (
              <Tooltip title={`${record.latitude}, ${record.longitude}`}>
                <EnvironmentOutlined style={{ color: 'var(--color-success-text)' }} className="cursor-help" />
              </Tooltip>
            )}
          </div>
          {record.ownerName && (
            <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Owner: {record.ownerName}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Route & Area',
      key: 'routeArea',
      render: (_: unknown, record: ShopResponse) => (
        <div>
          <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {record.route || <span style={{ color: 'var(--color-text-disabled)' }}>—</span>}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {record.area || ''}
          </div>
        </div>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone?: string) => {
        if (!phone) return <span style={{ color: 'var(--color-text-disabled)' }}>—</span>;
        const formatted = phone.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
        return (
          <span
            className="text-sm"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}
          >
            {formatted}
          </span>
        );
      },
    },
    {
      title: 'Assigned Rep',
      dataIndex: 'assignedRepName',
      key: 'assignedRepName',
      width: 150,
      render: (repName?: string) => {
        if (!repName) {
          return <span style={{ color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>Unassigned</span>;
        }
        return (
          <Tag className="m-0" style={{
            background: 'var(--color-primary-subtle)',
            borderColor: 'var(--color-primary-border)',
            color: 'var(--color-primary-text)',
          }}>
            {repName}
          </Tag>
        );
      },
    },
    {
      title: 'Outstanding Loan',
      dataIndex: 'outstandingLoan',
      key: 'outstandingLoan',
      width: 140,
      align: 'right',
      render: (loan?: number) => {
        if (!loan || loan === 0) {
          return <span style={{ color: 'var(--color-text-disabled)' }}>—</span>;
        }
        return (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 'var(--font-weight-medium)' as string,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--color-warning-text)',
          }}>
            LKR {loan.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      },
    },

    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: ShopResponse) => (
        <Space size="small">
          <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_SALES_MANAGER', 'ROLE_SALES_REP']}>
            <Tooltip title="View QR">
              <Button
                type="text"
                size="small"
                icon={<QrcodeOutlined />}
                onClick={() => handleShowQr(record)}
                style={{ color: 'var(--color-text-tertiary)' }}
                className="hover:text-emerald-500 transition-colors"
              />
            </Tooltip>
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                style={{ color: 'var(--color-text-tertiary)' }}
                className="hover:text-emerald-500 transition-colors"
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => setDeleteTarget(record)}
                style={{ color: 'var(--color-text-tertiary)' }}
                className="hover:text-red-500 transition-colors"
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

      <ShopQrModal 
        open={qrModalOpen} 
        onClose={() => setQrModalOpen(false)} 
        shop={selectedShop} 
        qrPayload={qrPayload} 
      />
    </>
  );
};
