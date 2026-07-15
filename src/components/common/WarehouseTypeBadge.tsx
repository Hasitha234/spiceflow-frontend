

interface Props {
  storeType: string;
}

export function WarehouseTypeBadge({ storeType }: Props) {
  const styles =
    storeType === 'MAIN'
      ? {
          background: 'var(--color-primary-subtle)',
          color: 'var(--color-primary-text)',
          border: '1px solid var(--color-primary-border)',
        }
      : storeType === 'VEHICLE'
      ? {
          background: 'var(--color-info-bg)',
          color: 'var(--color-info-text)',
          border: '1px solid var(--color-info-border)',
        }
      : {
          background: 'var(--color-accent-bg)',
          color: 'var(--color-accent-text)',
          border: '1px solid var(--color-accent-border)',
        };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        padding: '2px 8px',
        borderRadius: '4px',
        lineHeight: '18px',
        ...styles,
      }}
    >
      {storeType}
    </span>
  );
}
