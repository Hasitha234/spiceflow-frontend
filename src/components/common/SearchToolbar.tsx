import React, { useState, useEffect } from 'react';
import { Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

export interface SearchToolbarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
  extra?: React.ReactNode;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  extra,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs, onSearch]);

  return (
    <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <Input
        prefix={<SearchOutlined className="text-slate-500 mr-1" />}
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        allowClear
        className="max-w-md !bg-slate-900/60 !border-slate-700 !text-slate-200 focus:!border-emerald-500 rounded-lg py-1.5"
      />
      {extra && <Space wrap>{extra}</Space>}
    </div>
  );
};
