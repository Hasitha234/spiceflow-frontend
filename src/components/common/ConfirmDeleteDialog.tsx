import React from 'react';
import { Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { ResponsiveModal } from './ResponsiveModal';

export interface ConfirmDeleteDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  entityName?: string;
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  title = 'Confirm Deletion',
  description,
  entityName,
  confirmLoading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <ResponsiveModal
      open={open}
      title={
        <div className="flex items-center gap-2 text-red-400">
          <ExclamationCircleOutlined className="text-xl" />
          <span>{title}</span>
        </div>
      }
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={confirmLoading}>
          Cancel
        </Button>,
        <Button
          key="delete"
          type="primary"
          danger
          loading={confirmLoading}
          onClick={onConfirm}
          className="bg-red-600 hover:bg-red-500 border-none font-medium"
        >
          Delete
        </Button>,
      ]}
      className="dark-modal"
    >
      <div className="py-2 text-slate-300">
        {description ? (
          <p>{description}</p>
        ) : (
          <p>
            Are you sure you want to delete{' '}
            {entityName ? (
              <span className="font-semibold text-white">"{entityName}"</span>
            ) : (
              'this item'
            )}
            ? This action cannot be undone.
          </p>
        )}
      </div>
    </ResponsiveModal>
  );
};
