import React from 'react';

export interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className = '',
  glass = false,
}) => {
  return (
    <div
      className={`min-h-full transition-all duration-300 ${
        glass ? 'glass rounded-xl p-6 shadow-xl border border-slate-700/50' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
