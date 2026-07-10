import React from 'react';
import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  message?: string; // Alias for description
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description,
  message,
  actionText,
  onAction,
  icon,
}) => {
  const displayDescription = message || description || 'There are currently no items matching your criteria or available in this section.';
  return (
    <div className="py-12 px-6 flex flex-col items-center justify-center text-center h-full">
      <Empty
        image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="max-w-md mx-auto">
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.125rem' }}>{title}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>{displayDescription}</p>
          </div>
        }
      >
        {actionText && onAction && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAction}
            style={{ borderRadius: 'var(--radius-md)' }}
            className="mt-4 bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-900/30 font-medium"
          >
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
};
