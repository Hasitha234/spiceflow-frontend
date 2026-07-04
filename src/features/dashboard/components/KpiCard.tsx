import React from 'react';
import { Card } from 'antd';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColorClass?: string;
  badgeText?: string;
  badgeType?: 'up' | 'down' | 'neutral';
  footerText?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon,
  iconColorClass = 'icon-emerald',
  badgeText,
  badgeType = 'neutral',
  footerText,
}) => {
  return (
    <Card className="kpi-card" variant="borderless">
      <div className="kpi-header">
        <h4 className="kpi-title">{title}</h4>
        <div className={`kpi-icon-box ${iconColorClass}`}>
          {icon}
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      {(badgeText || footerText) && (
        <div className="kpi-footer">
          {badgeText && (
            <span className={`kpi-badge badge-${badgeType}`}>
              {badgeText}
            </span>
          )}
          {footerText && <span>{footerText}</span>}
        </div>
      )}
    </Card>
  );
};
