import React from 'react';
import { Skeleton } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import type { SupplierLeadTime } from '../types';

interface SupplierLeadTimeTableProps {
  data: SupplierLeadTime[];
  loading: boolean;
}

export const SupplierLeadTimeTable: React.FC<SupplierLeadTimeTableProps> = ({ data, loading }) => {
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
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton.Input key={i} active block style={{ height: 40, borderRadius: 8 }} />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-600">
          <TrophyOutlined className="text-3xl mb-2" />
          <p className="text-sm">No completed orders yet</p>
        </div>
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
