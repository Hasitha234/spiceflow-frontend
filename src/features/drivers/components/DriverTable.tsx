import React, { useState } from 'react';
import { Button, Space, Tooltip, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { DataTable, ConfirmDeleteDialog, PermissionGuard } from '@/components/common';
import type { DriverResponse } from '@/api/generated';
import { DriverResponseStatus, DriverResponseLicenseClass } from '@/api/generated';
import { useDeleteDriver } from '../hooks/useDeleteDriver';
import type { TableState } from '@/hooks/useTableState';

export interface DriverTableProps {
  data: DriverResponse[];
  total: number;
  loading: boolean;
  tableState: TableState;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  onSortChange: (field: string, dir: 'asc' | 'desc') => void;
  onEdit: (driver: DriverResponse) => void;
}

export const DriverTable: React.FC<DriverTableProps> = ({
  data,
  total,
  loading,
  tableState,
  onPageChange,
  onSizeChange,
  onSortChange,
  onEdit,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<DriverResponse | null>(null);
  const deleteMutation = useDeleteDriver({
    onSuccess: () => setDeleteTarget(null),
  });

  const getStatusTag = (status?: DriverResponseStatus) => {
    switch (status) {
      case DriverResponseStatus.AVAILABLE:
        return <Tag color="success" className="m-0 font-medium">Available</Tag>;
      case DriverResponseStatus.ON_ROUTE:
        return <Tag color="processing" className="m-0 font-medium">On Route</Tag>;
      case DriverResponseStatus.ON_LEAVE:
        return <Tag color="warning" className="m-0 font-medium">On Leave</Tag>;
      case DriverResponseStatus.SUSPENDED:
        return <Tag color="error" className="m-0 font-medium">Suspended</Tag>;
      default:
        return <Tag className="m-0">{status || 'Unknown'}</Tag>;
    }
  };

  const getLicenseTag = (licenseClass?: DriverResponseLicenseClass) => {
    if (!licenseClass) return <span className="text-slate-500">—</span>;
    switch (licenseClass) {
      case DriverResponseLicenseClass.LIGHT:
        return <Tag color="cyan" className="m-0 font-mono text-xs">Light</Tag>;
      case DriverResponseLicenseClass.HEAVY:
        return <Tag color="blue" className="m-0 font-mono text-xs">Heavy</Tag>;
      case DriverResponseLicenseClass.ARTICULATED:
        return <Tag color="purple" className="m-0 font-mono text-xs">Articulated</Tag>;
      default:
        return <Tag className="m-0 font-mono text-xs">{licenseClass}</Tag>;
    }
  };

  const columns: ColumnsType<DriverResponse> = [
    {
      title: 'Driver Details',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (name: string, record: DriverResponse) => (
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
      width: 200,
      render: (_: unknown, record: DriverResponse) => (
        <div>
          {record.email && <div className="text-slate-300 text-sm">{record.email}</div>}
          <div className="text-xs text-slate-400 font-mono">{record.phone || 'No phone'}</div>
        </div>
      ),
    },
    {
      title: 'Licensing',
      key: 'licensing',
      width: 180,
      render: (_: unknown, record: DriverResponse) => (
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-slate-200 text-xs">{record.licenseNumber || 'No License'}</span>
            {getLicenseTag(record.licenseClass)}
          </div>
          {record.licenseExpiry && (
            <div className="text-[11px] text-slate-400">Exp: {record.licenseExpiry.substring(0, 10)}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Logistics & Vehicle',
      key: 'logistics',
      width: 200,
      render: (_: unknown, record: DriverResponse) => (
        <div>
          <div className="text-slate-300 font-medium text-sm">
            {record.assignedVehicle ? (
              <span className="font-mono bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs">
                {record.assignedVehicle}
              </span>
            ) : (
              <span className="text-slate-500 italic">No vehicle assigned</span>
            )}
          </div>
          {record.defaultWarehouseName && (
            <div className="text-xs text-slate-400 mt-1">Wh: {record.defaultWarehouseName}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Operational Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      align: 'center',
      render: (status?: DriverResponseStatus) => getStatusTag(status),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      align: 'center',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'} className="m-0">
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'right',
      render: (_: unknown, record: DriverResponse) => (
        <Space size="small">
          <PermissionGuard requireRole={['ROLE_TENANT_OWNER', 'ROLE_SALES_MANAGER', 'ROLE_INVENTORY_MANAGER']}>
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
    sorter: SorterResult<DriverResponse> | SorterResult<DriverResponse>[]
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
      <DataTable<DriverResponse>
        columns={columns}
        dataSource={data}
        rowKey="id"
        isLoading={loading}
        emptyTitle="No drivers found"
        emptyDescription="Register your first delivery driver and assign their vehicle."
        pagination={{
          current: tableState.page + 1,
          pageSize: tableState.size,
          total,
          showSizeChanger: true,
          showTotal: (totalCount) => `Total ${totalCount} drivers`,
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
