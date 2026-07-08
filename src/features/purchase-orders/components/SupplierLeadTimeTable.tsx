import React from 'react';
import { Skeleton } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { EmptyState } from '@/components/common/EmptyState';
import type { KpiStatStatus } from '@/components/common/KpiStatCard';
import type { SupplierLeadTime } from '../types';

interface SupplierLeadTimeTableProps {
  data: SupplierLeadTime[];
  status: KpiStatStatus;
}

export const SupplierLeadTimeTable: React.FC<SupplierLeadTimeTableProps> = ({ data, status }) => {
  const sorted = [...data].sort((a, b) => a.averageLeadTimeDays - b.averageLeadTimeDays);

  const getLeadTimeColor = (days: number) => {
    if (days <= 7) return 'text-emerald-400';
    if (days <= 14) return 'text-amber-400';
    return 'text-red-400';
  };

  const getLeadTimeBg = (days: number) => {
    if (days <= 7) return 'bg-emerald-500/20';
    if (days <= 14) return 'bg-amber-500/20';
    return 'bg-red-500/20';
  };

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 h-full">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
        Supplier Lead Times
      </h3>
      {status === 'loading' ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton.Input key={i} active block style={{ height: 40, borderRadius: 8 }} />
          ))}
        </div>
      ) : status === 'error' ? (
        <EmptyState 
          title="Error loading lead times" 
          description="We couldn't fetch supplier lead times. Please refresh." 
        />
      ) : data.length === 0 ? (
        <EmptyState 
          icon={<TrophyOutlined className="text-4xl text-emerald-500 mb-2" />}
          title="No completed orders yet" 
          description="Once orders are fully received, supplier lead times will appear here." 
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((s, idx) => (
            <div
              key={s.supplierId}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-slate-800/80 hover:bg-slate-700/60 transition-colors"
            >
              <span className="text-xs font-mono text-slate-600 w-5 text-right flex-shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{s.supplierName}</p>
                <p className="text-xs text-slate-500">
                  {s.completedOrders}/{s.totalOrders} orders completed
                </p>
              </div>
              <div
                className={`flex-shrink-0 rounded-md px-2 py-1 text-xs font-bold tabular-nums ${getLeadTimeBg(s.averageLeadTimeDays)} ${getLeadTimeColor(s.averageLeadTimeDays)}`}
              >
                {s.averageLeadTimeDays.toFixed(1)}d
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
