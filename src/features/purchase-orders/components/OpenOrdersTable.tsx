import React from 'react';
import { Skeleton, Tooltip } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { DataTable } from '@/components/common';
import { PurchaseOrderStatusBadge } from './PurchaseOrderStatusBadge';
import type { OpenPurchaseOrderProjection } from '../types';

interface OpenOrdersTableProps {
  data: OpenPurchaseOrderProjection[];
  loading: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const OpenOrdersTable: React.FC<OpenOrdersTableProps> = ({ data, loading }) => {
  const columns: ColumnsType<OpenPurchaseOrderProjection> = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (po: string) => (
        <span className="font-mono text-sm text-blue-400 font-semibold">{po}</span>
      ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
      ellipsis: true,
      render: (name: string) => (
        <span className="text-slate-200 font-medium">{name}</span>
      ),
    },
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 130,
      render: (d: string) => (
        <span className="text-slate-400 text-sm">{formatDate(d)}</span>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      align: 'right',
      render: (v: number) => (
        <span className="text-slate-200 font-semibold tabular-nums text-sm">{fmt(v)}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => <PurchaseOrderStatusBadge status={status} />,
    },
    {
      title: 'Age',
      dataIndex: 'ageInDays',
      key: 'ageInDays',
      width: 90,
      align: 'center',
      render: (days: number) => {
        const isOverdue = days > 30;
        return (
          <Tooltip title={isOverdue ? 'Overdue — requires attention' : `${days} days since order`}>
            <span
              className={`inline-flex items-center gap-1 text-sm font-medium tabular-nums ${
                isOverdue ? 'text-red-400' : days > 14 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {isOverdue && <WarningOutlined className="text-xs" />}
              {days}d
            </span>
          </Tooltip>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="space-y-2 mt-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton.Input key={i} active block style={{ height: 44, borderRadius: 8 }} />
        ))}
      </div>
    );
  }

  return (
    <DataTable<OpenPurchaseOrderProjection>
      dataSource={data}
      columns={columns}
      rowKey="poNumber"
      isLoading={false}
      emptyTitle="No open orders"
      emptyDescription="All purchase orders have been received or there are no orders yet."
      pagination={false}
      scroll={{ x: 700 }}
    />
  );
};
