import React from 'react';
import { Pagination, Typography } from 'antd';
import { pluralize } from '@/utils/pluralize';

const { Text } = Typography;

export interface ListPageFooterProps {
  totalCount: number;
  pageSize: number;
  currentPage: number;
  itemNameSingular: string;
  itemNamePlural?: string;
  onPageChange: (page: number, size: number) => void;
}

/**
 * Shared List Page Footer Component
 * 
 * CENTRALIZED UTILITY:
 * This component consolidates identical pagination footer logic that previously 
 * existed inline across 4 list pages (Settings overview, Drivers, Suppliers, Products).
 * 
 * DESIGN PHILOSOPHY:
 * Handles systemic bugs centrally:
 * 1. Pluralization is enforced using the shared `pluralize` utility.
 * 2. When total records fit on a single page, the pagination controls are visually
 *    de-emphasized (reduced opacity, pointer-events none) rather than hidden completely.
 *    This prevents jarring layout jumps while preventing false interactivity.
 */
export const ListPageFooter: React.FC<ListPageFooterProps> = ({
  totalCount,
  pageSize,
  currentPage,
  itemNameSingular,
  itemNamePlural,
  onPageChange,
}) => {
  const isSinglePage = totalCount <= pageSize;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '16px 24px', 
      borderTop: '1px solid var(--surface-border)', 
      backgroundColor: 'var(--surface-base)',
      borderBottomLeftRadius: 'var(--radius-lg)',
      borderBottomRightRadius: 'var(--radius-lg)'
    }}>
      <Text type="secondary">
        Total {totalCount} {pluralize(totalCount, itemNameSingular, itemNamePlural)}
      </Text>
      
      <div 
        style={{ 
          opacity: isSinglePage ? 0.4 : 1, 
          pointerEvents: isSinglePage ? 'none' : 'auto',
          transition: 'opacity 0.2s ease-in-out'
        }}
      >
        <Pagination 
          current={currentPage}
          pageSize={pageSize}
          total={totalCount}
          onChange={onPageChange}
          showSizeChanger
          pageSizeOptions={['10', '20', '50']}
        />
      </div>
    </div>
  );
};
