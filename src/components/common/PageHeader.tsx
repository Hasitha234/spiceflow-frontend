import React from 'react';
import { Breadcrumb, Typography, Space } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

export interface BreadcrumbItem {
  title: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  extra?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  extra,
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb
            className="mb-2"
            items={breadcrumbs.map((item) => ({
              title: item.href ? (
                <Link to={item.href} className="text-slate-500 hover:text-emerald-500 transition-colors">
                  {item.title}
                </Link>
              ) : (
                <span className="text-slate-500 font-medium">{item.title}</span>
              ),
            }))}
          />
        )}
        <Title level={2} className="!mb-0 !text-slate-100 font-bold tracking-tight">
          {title}
        </Title>
        {subtitle && (
          <Text className="text-slate-400 text-sm mt-1 block">
            {subtitle}
          </Text>
        )}
      </div>
      {extra && <Space className="mt-4 md:mt-0">{extra}</Space>}
    </div>
  );
};
