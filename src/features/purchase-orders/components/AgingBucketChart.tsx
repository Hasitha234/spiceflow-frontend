import React from 'react';
import { Row, Col } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { EmptyState } from '@/components/common/EmptyState';
import { KpiStatCard } from '@/components/common/KpiStatCard';
import type { KpiStatStatus } from '@/components/common/KpiStatCard';
import type { AgingBucket } from '../types';

interface AgingBucketChartProps {
  buckets: AgingBucket[];
  status: KpiStatStatus;
}

const BUCKET_THEMES = [
  { iconColor: 'icon-emerald', tagColor: 'green' },
  { iconColor: 'icon-amber', tagColor: 'orange' },
  { iconColor: 'icon-orange', tagColor: 'orange' },
  { iconColor: 'icon-rose', tagColor: 'red' },
];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const AgingBucketChart: React.FC<AgingBucketChartProps> = ({ buckets, status }) => {
  const allZero = buckets.length > 0 && buckets.every(b => b.orderCount === 0);

  if (status === 'success' && (allZero || buckets.length === 0)) {
    return (
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 h-full">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Aging Analysis
        </h3>
        <EmptyState 
          icon={<CheckCircleOutlined className="text-4xl text-emerald-500 mb-2" />}
          title="No orders to age" 
          description="There is nothing outstanding in the aging buckets." 
        />
      </div>
    );
  }

  // If loading or error, we still want to show the framing of cards, but since it's 4 items, we can map over 4 dummy items if empty, or map over the buckets
  const displayBuckets = buckets.length === 4 ? buckets : [
    { bucketLabel: '0-30 Days', orderCount: 0, totalValue: 0 },
    { bucketLabel: '31-60 Days', orderCount: 0, totalValue: 0 },
    { bucketLabel: '61-90 Days', orderCount: 0, totalValue: 0 },
    { bucketLabel: '90+ Days', orderCount: 0, totalValue: 0 },
  ];

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 h-full">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
        Aging Analysis
      </h3>
      <Row gutter={[12, 12]}>
        {displayBuckets.map((bucket, idx) => {
          const theme = BUCKET_THEMES[idx] ?? BUCKET_THEMES[3];
          return (
            <Col xs={24} sm={12} key={bucket.bucketLabel}>
              <KpiStatCard
                title={bucket.bucketLabel}
                value={fmt(bucket.totalValue)}
                icon={null}
                badgeText={`${bucket.orderCount} orders`}
                tagColor={theme.tagColor}
                iconColorClass={theme.iconColor}
                status={status}
              />
            </Col>
          );
        })}
      </Row>
    </div>
  );
};
