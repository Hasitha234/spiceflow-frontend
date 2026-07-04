import React from 'react';
import { Tag } from 'antd';
import type { PurchaseOrderStatus } from '../types';

interface PurchaseOrderStatusBadgeProps {
  status: PurchaseOrderStatus;
}

const STATUS_CONFIG: Record<
  PurchaseOrderStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Draft',
    className: '!bg-slate-800 !border-slate-600 !text-slate-300',
  },
  SUBMITTED: {
    label: 'Submitted',
    className: '!bg-blue-950/60 !border-blue-600/50 !text-blue-300',
  },
  APPROVED: {
    label: 'Approved',
    className: '!bg-violet-950/60 !border-violet-600/50 !text-violet-300',
  },
  REJECTED: {
    label: 'Rejected',
    className: '!bg-red-950/60 !border-red-600/50 !text-red-300',
  },
  ORDERED: {
    label: 'Ordered',
    className: '!bg-amber-950/60 !border-amber-600/50 !text-amber-300',
  },
  PARTIALLY_RECEIVED: {
    label: 'Partial',
    className: '!bg-orange-950/60 !border-orange-500/50 !text-orange-300',
  },
  RECEIVED: {
    label: 'Received',
    className: '!bg-emerald-950/60 !border-emerald-600/50 !text-emerald-300',
  },
  CLOSED: {
    label: 'Closed',
    className: '!bg-slate-900 !border-slate-700 !text-slate-500',
  },
};

export const PurchaseOrderStatusBadge: React.FC<PurchaseOrderStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: '!bg-slate-800 !border-slate-600 !text-slate-300',
  };
  return (
    <Tag className={`px-2.5 py-0.5 rounded-md font-medium text-xs ${config.className}`}>
      {config.label}
    </Tag>
  );
};
