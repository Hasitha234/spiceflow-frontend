import React from 'react';
import { Drawer, Button } from 'antd';
import { useIsMobile } from '@/hooks/useResponsive';

export interface EntityFormDrawerProps {
  open: boolean;
  title: string;
  mode?: 'create' | 'edit';
  loading?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitText?: string;
  children: React.ReactNode;
}

export const EntityFormDrawer: React.FC<EntityFormDrawerProps> = ({
  open,
  title,
  loading = false,
  onClose,
  onSubmit,
  submitText = 'Save Changes',
  children,
}) => {
  const isMobile = useIsMobile();

  return (
    <Drawer
      title={<span className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>{title}</span>}
      size={isMobile ? 'default' : 'large'}
      placement={isMobile ? 'bottom' : 'right'} rootClassName={isMobile ? 'sf-full-height-drawer' : ''}
      onClose={onClose}
      open={open}
      destroyOnHidden
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '12px 0', borderTop: '1px solid var(--color-border-default)' }}>
          <Button onClick={onClose} disabled={loading} style={{ borderRadius: 'var(--radius-md)' }}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={onSubmit}
            style={{ borderRadius: 'var(--radius-md)' }}
            className="font-medium"
          >
            {submitText}
          </Button>
        </div>
      }
    >
      <div className="pt-2 pb-6 space-y-4">{children}</div>
    </Drawer>
  );
};
