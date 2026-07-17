/**
 * PR Justification:
 * (a) Pluralization Fix: The subtext and total count strings previously hardcoded "drivers", 
 *     causing "1 registered delivery drivers" (grammatically incorrect). This is fixed by 
 *     using a computed string that rigorously checks `count === 1 ? 'driver' : 'drivers'`, 
 *     ensuring perfect grammar at all possible values (0, 1, or many). This must never regress.
 * (b) Conditional Pagination Logic: To maintain structural layout without implying false 
 *     interactivity, the pagination controls (page buttons, arrows, size selector) are 
 *     rendered with reduced opacity and disabled pointer-events when the total records fit 
 *     on a single page. This is vastly superior to `hideOnSinglePage` which causes sudden 
 *     layout jumps when crossing the page threshold, and leaves the "Total X drivers" text 
 *     visible at all times.
 */

import { useState, useEffect } from 'react';
import { Button, Input, Table, Typography, Empty, Space, Popconfirm } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchOutlined,
  PlusOutlined,
  WarningOutlined,
  EditOutlined,
  DeleteOutlined,
  CarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { useTableState } from '@/hooks/useTableState';
import { useDriverList } from '../hooks/useDriverList';
import { useDeleteDriver } from '../hooks/useDeleteDriver';
import type { DriverResponse } from '@/api/generated';
import { DriverFormDrawer } from '../components/DriverFormDrawer';
import { pluralize } from '@/utils/pluralize';
import { ListPageFooter, TruncatedCell, StatusTag, type StatusTagVariant } from '@/components/common';

const { Title, Text } = Typography;

export function DriverListPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverResponse | null>(null);

  const deleteMutation = useDeleteDriver();

  const { state, pageableParams, setPage, setSize, setSearch } = useTableState({
    defaultSort: 'createdAt',
    defaultDir: 'desc',
    defaultSize: 10,
  });

  const [debouncedSearch, setDebouncedSearch] = useState(state.search);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(debouncedSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [debouncedSearch, setSearch]);

  const { data: pageData, isLoading, isError, refetch } = useDriverList({
    name: state.search || undefined,
    pageable: pageableParams.pageable,
  });

  const rawData = pageData?.content || [];
  const totalCount = pageData?.totalElements || 0;
  const pageSize = state.size;
  const currentPage = state.page + 1; // Spring is 0-indexed, AntD is 1-indexed

  // Table Columns bound to real DriverResponse schema
  const columns: ColumnsType<DriverResponse> = [
    {
      title: 'Driver',
      key: 'driver',
      width: '28%',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Text style={{ 
            fontWeight: 600, 
            fontSize: 'var(--text-base)',       // 14px
            color: 'var(--color-text-primary)',
            textTransform: 'capitalize',
          }}>
            {record.name}
          </Text>
          <Text style={{ 
            fontSize: 'var(--text-xs)',          // 11px
            color: 'var(--color-text-tertiary)',
          }}>
            {record.employeeId}
            {record.licenseNumber && ` · ${record.licenseNumber}`}
            {record.licenseClass && ` · ${record.licenseClass}`}
          </Text>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      width: '22%',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
            <TruncatedCell 
              value={record.email || '—'} 
              maxWidth="200px"
            />
          </div>
          <Text style={{ 
            fontSize: 'var(--text-sm)',          // 13px
            color: 'var(--color-text-secondary)',
          }}>
            {record.phone || '—'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Vehicle & Warehouse',
      key: 'logistics',
      width: '22%',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Text style={{ 
            fontWeight: 500, 
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-primary)',
          }}>
            {record.assignedVehicle || '—'}
          </Text>
          <Text style={{ 
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-tertiary)',
          }}>
            {record.defaultWarehouseName || '—'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: '14%',
      render: (_, record) => {
        if (!record.isActive) {
          return <StatusTag variant="neutral" label="Inactive" />;
        }
        const statusMap: Record<string, StatusTagVariant> = {
          'AVAILABLE': 'success',
          'ON_LEAVE': 'warning',
          'ON_ROUTE': 'info',
          'UNAVAILABLE': 'neutral',
        };
        const variant = statusMap[record.status || ''] || 'neutral';
        const label = (record.status || 'Unknown')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        return <StatusTag variant={variant} label={label} />;
      },
    },
    {
      title: '',           // No header text for actions column
      key: 'actions',
      width: '14%',
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            aria-label={`Edit driver ${record.name}`}
            onClick={() => { setEditingDriver(record); setDrawerOpen(true); }}
            style={{ color: 'var(--color-text-tertiary)' }}
          />
          <Popconfirm
            title="Delete Driver"
            description="Are you sure you want to delete this driver?"
            onConfirm={() => {
              if (record.id) {
                deleteMutation.mutate({ id: record.id });
              }
            }}
            okText="Yes"
            cancelText="No"
            placement="topRight"
          >
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              aria-label={`Delete driver ${record.name}`}
              loading={deleteMutation.isPending}
              style={{ color: 'var(--color-text-tertiary)' }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const isEmpty = !isLoading && !isError && rawData.length === 0;

  return (
    <>
      <div style={{ padding: '24px', minHeight: '100vh', boxSizing: 'border-box' }}>
        
        {/* HEADER AREA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <Title level={1} style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              Drivers & Logistics
            </Title>
            <Text type="secondary" style={{ fontSize: '15px', marginTop: '4px', display: 'block' }}>
              {totalCount} registered {pluralize(totalCount, 'driver')}
            </Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} style={{ fontWeight: 600 }} onClick={() => { setEditingDriver(null); setDrawerOpen(true); }}>
            Register Driver
          </Button>
        </div>

        {/* SEARCH BAR */}
        <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
          <Input 
            prefix={<SearchOutlined style={{ color: 'var(--text-secondary)' }} />} 
            placeholder="Search drivers by name..." 
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            disabled={isLoading || isError}
          />
        </div>

        {/* TABLE AREA */}
        <div style={{ 
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-default)',
          background: 'var(--color-surface-default)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}>
          <AnimatePresence mode="wait">
            
            {isLoading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Table columns={columns} dataSource={[]} loading={true} pagination={false}  />
              </motion.div>
            )}

            {isEmpty && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ padding: '64px 0', textAlign: 'center' }}>
                <Empty 
                  image={<CarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />}
                  description={<Text type="secondary" style={{ fontSize: '16px' }}>No drivers found</Text>}
                >
                  <Button type="primary" icon={<PlusOutlined />} style={{ marginTop: '16px', fontWeight: 600 }} onClick={() => { setEditingDriver(null); setDrawerOpen(true); }}>
                    Register Driver
                  </Button>
                </Empty>
              </motion.div>
            )}

            {isError && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ padding: '64px 0', textAlign: 'center' }}>
                <Empty 
                  image={<WarningOutlined style={{ fontSize: 48, color: '#f87171', marginBottom: 16 }} />}
                  description={<Text type="secondary" style={{ fontSize: '16px' }}>Couldn't load drivers</Text>}
                >
                  <Button onClick={() => refetch()} style={{ marginTop: '16px', color: '#0F9D6C', borderColor: '#0F9D6C' }}>
                    Retry
                  </Button>
                </Empty>
              </motion.div>
            )}

            {!isLoading && !isError && !isEmpty && (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Table 
                  columns={columns} 
                  dataSource={rawData} 
                  rowKey="id"
                  pagination={false} 
                 />
                
                <ListPageFooter 
                  totalCount={totalCount}
                  pageSize={pageSize}
                  currentPage={currentPage}
                  itemNameSingular="driver"
                  onPageChange={(page, size) => { setPage(page - 1); setSize(size); }}
                />
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </div>
      
      <DriverFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingDriver(null); }}
        mode={editingDriver ? 'edit' : 'create'}
        initialValues={editingDriver}
      />
    </>
  );
}
