import React from 'react';
import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are currently no items matching your criteria or available in this section.',
  actionText,
  onAction,
}) => {
  return (
    <div className="py-12 px-6 glass rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-center">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="max-w-md mx-auto">
            <p className="text-slate-200 font-semibold text-lg">{title}</p>
            <p className="text-slate-400 text-sm mt-1">{description}</p>
          </div>
        }
      >
        {actionText && onAction && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAction}
            className="mt-4 bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-900/30 font-medium"
          >
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
};
