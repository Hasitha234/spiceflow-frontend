import React from 'react';
import { Skeleton } from 'antd';
import type { AgingBucket } from '../types';

interface AgingBucketBarProps {
  buckets: AgingBucket[];
  loading: boolean;
}

const BUCKET_COLORS = [
  { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { bar: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  { bar: 'bg-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/10' },
  { bar: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const AgingBucketChart: React.FC<AgingBucketBarProps> = ({ buckets, loading }) => {
  const maxCount = Math.max(...buckets.map((b) => b.orderCount), 1);

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 h-full">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
        Aging Analysis
      </h3>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton.Input key={i} active block style={{ height: 48, borderRadius: 8 }} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {buckets.map((bucket, idx) => {
            const color = BUCKET_COLORS[idx] ?? BUCKET_COLORS[3];
            const pct = Math.round((bucket.orderCount / maxCount) * 100);
            return (
              <div key={bucket.bucketLabel} className={`rounded-lg p-3 ${color.bg}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-300">{bucket.bucketLabel}</span>
                  <span className={`text-xs font-semibold ${color.text}`}>
                    {bucket.orderCount} orders
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${color.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{fmt(bucket.totalValue)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
