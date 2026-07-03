import React from 'react';
import { Result, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  traceId?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while processing your request. Please try again.',
  traceId,
  onRetry,
}) => {
  return (
    <div className="py-12 px-6 glass rounded-xl border border-red-900/40">
      <Result
        status="error"
        title={<span className="text-slate-100 font-bold text-xl">{title}</span>}
        subTitle={
          <div className="max-w-lg mx-auto space-y-2">
            <p className="text-slate-300">{message}</p>
            {traceId && (
              <div className="bg-slate-900/80 px-3 py-1.5 rounded text-xs border border-slate-800 font-mono text-slate-400">
                Trace ID: <span className="text-emerald-400">{traceId}</span>
              </div>
            )}
          </div>
        }
        extra={
          onRetry && (
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-500 border-none font-medium shadow-lg shadow-red-900/30"
            >
              Retry Request
            </Button>
          )
        }
      />
    </div>
  );
};
