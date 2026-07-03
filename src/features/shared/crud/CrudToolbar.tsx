import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PageHeader, PermissionGuard } from '@/components/common';
import type { BreadcrumbItem } from '@/components/common/PageHeader';

export interface CrudToolbarProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  addLabel?: string;
  onAdd?: () => void;
  requireRole?: string | string[];
  requirePermission?: string;
}

/**
 * Standard CRUD toolbar header wrapping PageHeader and PermissionGuard
 * for Add Entity buttons across master data views.
 */
export const CrudToolbar: React.FC<CrudToolbarProps> = ({
  title,
  subtitle,
  breadcrumbs,
  addLabel = 'Add New',
  onAdd,
  requireRole,
  requirePermission,
}) => {
  const addButton = onAdd && (
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={onAdd}
      className="bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-900/30 font-medium"
    >
      {addLabel}
    </Button>
  );

  const extraContent = addButton ? (
    requireRole || requirePermission ? (
      <PermissionGuard requireRole={requireRole} requirePermission={requirePermission}>
        {addButton}
      </PermissionGuard>
    ) : (
      addButton
    )
  ) : undefined;

  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      extra={extraContent}
    />
  );
};
