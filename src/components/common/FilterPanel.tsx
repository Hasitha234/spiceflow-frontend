import React, { useState, useEffect, useCallback } from 'react';
import { Input, Select, DatePicker, Button } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

// ─── Filter Definitions ──────────────────────────────────────────────────────

export interface SearchFilterDef {
  type: 'search';
  key: string;
  placeholder?: string;
  debounceMs?: number;
}

export interface SelectFilterDef {
  type: 'select';
  key: string;
  label: string;
  placeholder?: string;
  options: { label: string; value: string | number }[];
  allowClear?: boolean;
}

export interface DateRangeFilterDef {
  type: 'dateRange';
  key: string;
  label: string;
}

export type FilterDef = SearchFilterDef | SelectFilterDef | DateRangeFilterDef;

// ─── Component ───────────────────────────────────────────────────────────────

export interface FilterPanelProps {
  filters: FilterDef[];
  values: Record<string, string>;
  onChange: (key: string, value: string | null) => void;
  onReset: () => void;
  extra?: React.ReactNode;
}

/**
 * Configurable filter panel that renders a row of filter controls.
 * Each filter's value is managed externally (typically by useTableState)
 * through the `values`/`onChange` contract, keeping this component
 * pure and reusable across every CRUD page.
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  values,
  onChange,
  onReset,
  extra,
}) => {
  const hasActiveFilters = Object.values(values).some((v) => v && v.length > 0);

  return (
    <div className="mb-4 glass-subtle rounded-xl border border-slate-700/50 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {filters.map((filter) => (
          <FilterControl
            key={filter.key}
            filter={filter}
            value={values[filter.key] ?? ''}
            onChange={(val) => onChange(filter.key, val)}
          />
        ))}

        {hasActiveFilters && (
          <Button
            icon={<ClearOutlined />}
            onClick={onReset}
            className="!text-slate-400 hover:!text-slate-200"
          >
            Reset
          </Button>
        )}

        {extra && <div className="ml-auto">{extra}</div>}
      </div>
    </div>
  );
};

// ─── Individual Filter Renderers ─────────────────────────────────────────────

interface FilterControlProps {
  filter: FilterDef;
  value: string;
  onChange: (value: string | null) => void;
}

const FilterControl: React.FC<FilterControlProps> = ({ filter, value, onChange }) => {
  switch (filter.type) {
    case 'search':
      return <DebouncedSearch filter={filter} value={value} onChange={onChange} />;
    case 'select':
      return (
        <Select
          placeholder={filter.placeholder ?? filter.label}
          value={value || undefined}
          onChange={(val) => onChange(val ?? null)}
          allowClear={filter.allowClear !== false}
          options={filter.options}
          style={{ minWidth: 180 }}
          className="!bg-slate-900/60 rounded-lg"
        />
      );
    case 'dateRange':
      return (
        <RangePicker
          onChange={(_, dateStrings) => {
            if (dateStrings[0] && dateStrings[1]) {
              onChange(`${dateStrings[0]},${dateStrings[1]}`);
            } else {
              onChange(null);
            }
          }}
          className="!bg-slate-900/60 !border-slate-700 rounded-lg"
        />
      );
    default:
      return null;
  }
};

// ─── Debounced Search Input ──────────────────────────────────────────────────

const DebouncedSearch: React.FC<{
  filter: SearchFilterDef;
  value: string;
  onChange: (value: string | null) => void;
}> = ({ filter, value, onChange }) => {
  const [local, setLocal] = useState(value);
  const debounceMs = filter.debounceMs ?? 300;

  // Sync external → local when URL changes
  useEffect(() => {
    setLocal(value);
  }, [value]);

  // Debounce local → external
  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) {
        onChange(local || null);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [local, debounceMs]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocal(e.target.value);
  }, []);

  return (
    <Input
      prefix={<SearchOutlined className="text-slate-500 mr-1" />}
      placeholder={filter.placeholder ?? 'Search...'}
      value={local}
      onChange={handleChange}
      allowClear
      onClear={() => onChange(null)}
      className="max-w-xs !bg-slate-900/60 !border-slate-700 !text-slate-200 focus:!border-emerald-500 rounded-lg py-1.5"
    />
  );
};
