import React from 'react';
import { Timeline, Tag, Typography, Card, Empty } from 'antd';
import { ClockCircleOutlined, UserOutlined, ArrowRightOutlined, TagOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

export interface AuditTimelineItem {
  id?: number | string;
  timestamp: string;
  actor: string;
  action: string;
  fromState: string;
  toState: string;
  correlationId: string;
  comment?: string;
}

export interface AuditTimelineProps {
  items: AuditTimelineItem[];
  title?: string;
  className?: string;
}

/**
 * Pure presentational component rendering an immutable append-only workflow audit timeline.
 * Does not fetch data, interpret state transitions, or compute business logic.
 */
export const AuditTimeline: React.FC<AuditTimelineProps> = ({
  items,
  title = 'Workflow Audit Timeline',
  className = '',
}) => {
  if (!items || items.length === 0) {
    return (
      <Card className={`bg-slate-900/60 border-slate-800 ${className}`}>
        <Empty description={<Text className="text-slate-400">No audit history recorded</Text>} />
      </Card>
    );
  }

  const timelineItems = items.map((item, index) => {
    const isLatest = index === items.length - 1;
    return {
      color: isLatest ? 'blue' : 'gray',
      icon: isLatest ? <ClockCircleOutlined className="text-blue-400 text-base" /> : undefined,
      content: (
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 mb-2 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Tag color="cyan" className="!bg-cyan-950/60 !border-cyan-600/50 !text-cyan-300 font-semibold m-0">
                {item.action}
              </Tag>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded text-xs text-slate-300">
                <span className="font-mono text-slate-400">{item.fromState}</span>
                <ArrowRightOutlined className="text-slate-500 text-[10px]" />
                <span className="font-mono text-emerald-400 font-medium">{item.toState}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                <TagOutlined className="text-slate-500" />
                <span className="font-mono text-[11px] text-slate-400">{item.correlationId}</span>
              </span>
              <span>{dayjs(item.timestamp).format('MMM D, YYYY h:mm A')}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <UserOutlined className="text-slate-500" />
              {item.actor}
            </span>
            {item.comment && (
              <Paragraph className="!mb-0 !text-slate-400 italic text-xs max-w-md truncate" title={item.comment}>
                "{item.comment}"
              </Paragraph>
            )}
          </div>
        </div>
      ),
    };
  });

  return (
    <Card
      title={<Text className="text-slate-200 font-semibold text-base">{title}</Text>}
      className={`bg-slate-950/40 border-slate-800/80 ${className}`}
      styles={{ body: { padding: '20px 20px 4px 20px' } }}
    >
      <Timeline items={timelineItems} className="pt-2" />
    </Card>
  );
};
