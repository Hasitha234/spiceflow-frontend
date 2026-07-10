import React from 'react';
import { Drawer, Button } from 'antd';

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
  return (
    <Drawer
      title={<span className="text-slate-100 font-semibold text-lg">{title}</span>}
      size="large"
      onClose={onClose}
      open={open}
      destroyOnClose
      className="!bg-slate-900 !text-slate-200"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '8px 0' }}>
          <Button onClick={onClose} disabled={loading} style={{ borderRadius: 'var(--radius-md)' }}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={onSubmit}
            style={{ borderRadius: 'var(--radius-md)' }}
            className="bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-900/30 font-medium"
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
