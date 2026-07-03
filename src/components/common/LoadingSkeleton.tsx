import React from 'react';
import { Skeleton, Card } from 'antd';

export interface LoadingSkeletonProps {
  rows?: number;
  type?: 'table' | 'card' | 'form';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 5,
  type = 'table',
}) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="glass border-slate-700/50">
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className="p-6 glass rounded-xl border border-slate-700/50 space-y-6">
        <Skeleton.Input active block style={{ height: 40 }} />
        <Skeleton active paragraph={{ rows: 4 }} />
        <div className="flex justify-end gap-3 pt-4">
          <Skeleton.Button active style={{ width: 100 }} />
          <Skeleton.Button active style={{ width: 120 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 glass rounded-xl border border-slate-700/50">
      <Skeleton active paragraph={{ rows }} />
    </div>
  );
};
