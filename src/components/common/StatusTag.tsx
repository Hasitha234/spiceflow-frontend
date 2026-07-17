import React from 'react';

export type StatusTagVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusTagProps {
  variant: StatusTagVariant;
  label: string;
}

const variantStyles: Record<StatusTagVariant, {
  background: string;
  color: string;
  border: string;
}> = {
  success: {
    background: 'var(--color-success-bg)',       // #d1fae5
    color: 'var(--color-success-text)',           // #047857
    border: 'var(--color-success-border)',        // #a7f3d0
  },
  warning: {
    background: 'var(--color-warning-bg)',        // #fef3c7
    color: 'var(--color-warning-text)',           // #b45309
    border: 'var(--color-warning-border)',        // #fde68a
  },
  danger: {
    background: 'var(--color-danger-bg)',         // #fee2e2
    color: 'var(--color-danger-text)',            // #b91c1c
    border: 'var(--color-danger-border)',         // #fecaca
  },
  info: {
    background: 'var(--color-info-bg)',           // #eff6ff
    color: 'var(--color-info-text)',              // #1d4ed8
    border: 'var(--color-info-border)',           // #bfdbfe
  },
  neutral: {
    background: 'var(--color-surface-subtle)',    // #f1f5f9
    color: 'var(--color-text-secondary)',         // #475569
    border: 'var(--color-border-default)',        // #e2e8f0
  },
};

export const StatusTag: React.FC<StatusTagProps> = ({ variant, label }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      height: '24px',
      padding: '0 10px',
      fontSize: 'var(--text-xs)',                // 11px
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: '0.02em',
      borderRadius: 'var(--radius-md)',          // 6px
      background: variantStyles[variant].background,
      color: variantStyles[variant].color,
      border: `1px solid ${variantStyles[variant].border}`,
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </span>
);
