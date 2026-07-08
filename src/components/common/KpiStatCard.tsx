import React from 'react';
import { Card, Skeleton, Button, Tag, Typography } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { WarningOutlined } from '@ant-design/icons';
import '@/features/dashboard/components/dashboard.css'; // Make sure to import the CSS that styles it

const { Text } = Typography;

export type KpiStatStatus = 'loading' | 'empty' | 'error' | 'success';

export interface KpiStatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  iconColorClass?: string; // used for Executive dashboard custom CSS icons if needed
  badgeText?: string;
  badgeType?: 'up' | 'down' | 'neutral';
  footerText?: string;
  status?: KpiStatStatus;
  onRetry?: () => void;
  tagColor?: string; // Alternative to badgeType for direct antd color
}

/**
 * Shared KPI Stat Card used across all operational dashboards.
 * Encapsulates the visual design, layout, and loading/error states.
 */
export const KpiStatCard: React.FC<KpiStatCardProps> = ({
  title,
  value,
  icon,
  iconColorClass,
  badgeText,
  badgeType = 'neutral',
  footerText,
  status = 'success',
  onRetry,
  tagColor,
}) => {
  // Map badgeType to AntD tag color if tagColor is not explicitly provided
  const finalTagColor = tagColor || (badgeType === 'up' ? 'green' : badgeType === 'down' ? 'red' : 'blue');

  return (
    <Card 
      className="kpi-card" 
      variant="borderless"
      style={{ height: '140px' }} 
      styles={{ body: { padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </Text>
        <div className={`kpi-icon-box ${iconColorClass || ''}`}>
          {icon}
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <Skeleton active paragraph={{ rows: 1 }} title={false} />
          </motion.div>
        )}
        
        {status === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <WarningOutlined style={{ color: '#f87171' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Text>Couldn't load</Text>
              {onRetry && (
                <Button type="link" size="small" onClick={onRetry} style={{ padding: 0, height: 'auto', textAlign: 'left', color: '#0F9D6C' }}>
                  Retry
                </Button>
              )}
            </div>
          </motion.div>
        )}
        
        {(status === 'success' || status === 'empty') && (
          <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1 }}>{value}</span>
              {badgeText && (
                <Tag color={finalTagColor} style={{ border: 'none', fontWeight: 600 }}>{badgeText}</Tag>
              )}
            </div>
            {footerText && (
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>{footerText}</Text>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
