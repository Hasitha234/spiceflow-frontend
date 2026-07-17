import React from 'react';
import { Modal, Drawer } from 'antd';
import type { ModalProps } from 'antd';
import { useIsMobile } from '@/hooks/useResponsive';

export interface ResponsiveModalProps extends ModalProps {
  mobileTitle?: React.ReactNode;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  children,
  mobileTitle,
  ...props
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer
        title={mobileTitle || props.title}
        placement="bottom" rootClassName="sf-full-height-drawer"
        onClose={(e) => props.onCancel?.(e as unknown as React.MouseEvent<HTMLButtonElement>)}
        open={props.open}
        destroyOnHidden
        footer={props.footer !== null && props.footer !== undefined ? (props.footer as unknown as React.ReactNode) : undefined}
        styles={{
          body: { padding: '16px' }
        }}
      >
        {children}
      </Drawer>
    );
  }

  return <Modal {...props}>{children}</Modal>;
};
