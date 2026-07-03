import React from 'react';
import { Tag } from 'antd';

export type StatusType =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DAMAGED'
  | 'PAID'
  | 'UNPAID'
  | 'PARTIAL'
  | 'DISPATCHED'
  | string;

export interface StatusBadgeProps {
  status: StatusType;
  text?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  const getTagProps = (s: string): { color: string; className?: string } => {
    const upper = s.toUpperCase();
    switch (upper) {
      case 'ACTIVE':
      case 'COMPLETED':
      case 'PAID':
      case 'DELIVERED':
        return { color: 'success', className: '!bg-emerald-950/60 !border-emerald-600/50 !text-emerald-300 font-medium' };
      case 'PENDING':
      case 'PARTIAL':
      case 'DISPATCHED':
        return { color: 'warning', className: '!bg-amber-950/60 !border-amber-600/50 !text-amber-300 font-medium' };
      case 'INACTIVE':
      case 'CANCELLED':
      case 'DAMAGED':
      case 'UNPAID':
        return { color: 'error', className: '!bg-red-950/60 !border-red-600/50 !text-red-300 font-medium' };
      default:
        return { color: 'default', className: '!bg-slate-800 !border-slate-700 !text-slate-300' };
    }
  };

  const { color, className } = getTagProps(status);

  return (
    <Tag color={color} className={`px-2.5 py-0.5 rounded-md ${className}`}>
      {text || status}
    </Tag>
  );
};
