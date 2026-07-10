import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

export interface TruncatedCellProps {
  /** The full text value to display and truncate if too long */
  value: string;
  /** Optional max width for the cell, though usually constrained by table column */
  maxWidth?: number | string;
  /** Optional class names to pass through */
  className?: string;
}

/**
 * Shared Truncated Cell Component
 * 
 * CENTRALIZED UTILITY:
 * This component consolidates inline text truncation logic (like WebkitLineClamp)
 * that previously existed independently across 4 list pages.
 * 
 * DESIGN PHILOSOPHY:
 * 1. Ensures any table cell showing potentially long strings (names, addresses)
 *    is uniformly truncated.
 * 2. Provides the full value via a fast, standardized hover tooltip.
 * 3. Uses fast transitions (100-200ms) with no bounce/spring easing.
 */
export const TruncatedCell: React.FC<TruncatedCellProps> = ({ 
  value, 
  maxWidth,
  className = '' 
}) => {
  if (!value) return <span className="text-slate-500">—</span>;

  return (
    <div style={{ maxWidth: maxWidth || '100%', overflow: 'hidden' }}>
      <Text 
        className={className}
        ellipsis={{ tooltip: { title: value, mouseEnterDelay: 0.15, align: { offset: [0, 4] } } }}
        style={{ width: '100%' }}
      >
        {value}
      </Text>
    </div>
  );
};
