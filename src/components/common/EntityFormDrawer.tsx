import React from 'react';
import { Drawer, Button, Space } from 'antd';

export interface EntityFormDrawerProps {
  open: boolean;
  title: string;
  width?: number | string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitText?: string;
  children: React.ReactNode;
}

export const EntityFormDrawer: React.FC<EntityFormDrawerProps> = ({
  open,
  title,
  width = 500,
  loading = false,
  onClose,
  onSubmit,
  submitText = 'Save Changes',
  children,
}) => {
  return (
    <Drawer
      title={<span className="text-slate-100 font-semibold text-lg">{title}</span>}
      width={width}
      onClose={onClose}
      open={open}
      destroyOnClose
      className="!bg-slate-900 !text-slate-200"
      extra={
        <Space>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={onSubmit}
            className="bg-emerald-600 hover:bg-emerald-500 border-none shadow-lg shadow-emerald-900/30 font-medium"
          >
            {submitText}
          </Button>
        </Space>
      }
    >
      <div className="pt-2 pb-6 space-y-4">{children}</div>
    </Drawer>
  );
};
