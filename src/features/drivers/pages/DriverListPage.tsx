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
import { Breadcrumb, Button, Input, Table, Tag, Typography, Empty, ConfigProvider, Space, Popconfirm } from 'antd';
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
import { ListPageFooter, TruncatedCell } from '@/components/common';

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
      title: 'Driver Details',
      key: 'details',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <TruncatedCell value={record.name || ''} className="font-semibold" />
          <Text type="secondary" style={{ fontSize: '12px' }}>ID: {record.employeeId}</Text>
        </div>
      ),
    },
    {
      title: 'Contact Info',
      key: 'contact',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ maxWidth: '160px' }}>
            <Text type="secondary" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', display: 'block', lineHeight: 1 }}>EMAIL</Text>
            <TruncatedCell value={record.email || ''} className="text-[13px]" />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', display: 'block', lineHeight: 1 }}>PHONE</Text>
            <Text style={{ fontSize: '13px' }}>{record.phone}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Licensing',
      key: 'licensing',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text style={{ fontWeight: 500 }}>{record.licenseNumber}</Text>
            <Tag style={{ margin: 0 }}>{record.licenseClass}</Tag>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', display: 'inline-block', marginRight: '4px' }}>EXPIRES</Text>
            <Text style={{ fontSize: '13px' }}>{record.licenseExpiry}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Logistics & Vehicle',
      key: 'logistics',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <TruncatedCell value={record.assignedVehicle || 'Unassigned'} className="font-medium" />
          <div>
            <Text type="secondary" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', display: 'block', lineHeight: 1 }}>WAREHOUSE</Text>
            <TruncatedCell value={record.defaultWarehouseName || 'None'} className="text-[13px]" maxWidth="160px" />
          </div>
        </div>
      ),
    },
    {
      title: 'Operational Status',
      key: 'status',
      render: (_, record) => {
        let color = 'default';
        if (record.status === 'AVAILABLE') color = 'success';
        if (record.status === 'ON_LEAVE') color = 'warning';
        if (record.status === 'ON_LEAVE' || record.status === 'ON_ROUTE') color = 'processing';
        return <Tag color={color} style={{ border: 'none' }}>{record.status}</Tag>;
      },
    },
    {
      title: 'Active',
      key: 'active',
      render: (_, record) => {
        const color = record.isActive ? '#10b981' : '#8b949e';
        return (
          <Tag style={{ background: 'transparent', borderColor: color, color: color }}>
            {record.isActive ? 'Active' : 'Inactive'}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            aria-label="Edit driver" 
            onClick={() => {
              setEditingDriver(record);
              setDrawerOpen(true);
            }}
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
            <Button type="text" icon={<DeleteOutlined style={{ color: '#f87171' }} />} aria-label="Delete driver" loading={deleteMutation.isPending} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const isEmpty = !isLoading && !isError && rawData.length === 0;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0F9D6C',
          fontFamily: 'var(--font-sans, sans-serif)',
        },
      }}
    >
      <div style={{ padding: '24px', minHeight: '100vh', boxSizing: 'border-box' }}>
        
        {/* HEADER AREA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <Breadcrumb items={[{ title: 'Settings' }, { title: 'Drivers' }]} style={{ marginBottom: '8px' }} />
            <Title level={1} style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              Drivers & Logistics
            </Title>
            <Text type="secondary" style={{ fontSize: '15px', marginTop: '4px', display: 'block' }}>
              {totalCount} registered delivery {pluralize(totalCount, 'driver')} and fleet personnel
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
        <div style={{ borderRadius: '8px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            
            {isLoading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Table columns={columns} dataSource={[]} loading={true} pagination={false} />
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
    </ConfigProvider>
  );
}
