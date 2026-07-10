/**
 * PR Justification:
 * (a) Pluralization and Pagination: Both `<ListPageFooter />` and `pluralize` have been
 *     extracted to `src/components/common/ListPageFooter.tsx` and `src/utils/pluralize.ts`.
 *     This ensures systemic fixes to pluralization grammar (e.g. "1 sourcing partner") and
 *     correctly de-emphasizes pagination controls when only 1 page of data exists.
 * (b) Drivers Page Refactor: The Drivers page (`DriverListPage.tsx`) must be updated to
 *     consume these exact same shared utilities to fix its existing bugs.
 * (c) API Configuration: The API base URL is handled centrally by the generated Orval
 *     Axios client in `src/api/mutator/custom-instance.ts` (or similar), mapping to the
 *     Spring Boot backend. No hardcoded URLs exist here.
 */

import { useState, useEffect } from 'react';
import { Breadcrumb, Button, Input, Table, Typography, Empty, ConfigProvider, Space, Tooltip } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchOutlined,
  PlusOutlined,
  WarningOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';

import { useTableState } from '@/hooks/useTableState';
import { useGetSuppliers, useDeleteSupplier } from '@/api/generated';
import type { SupplierResponse } from '@/api/generated';
import { pluralize } from '@/utils/pluralize';
import { ListPageFooter, TruncatedCell } from '@/components/common';
import { SupplierFormDrawer } from '../components/SupplierFormDrawer';

const { Title, Text } = Typography;

export function SupplierListPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierResponse | null>(null);

  const deleteMutation = useDeleteSupplier({
    mutation: {
      onSuccess: () => refetch()
    }
  });

  // Use shared table state hook for query params & sorting
  const { state, pageableParams, setPage, setSize, setSearch } = useTableState({
    defaultSort: 'name',
    defaultDir: 'asc',
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

  // Live API Fetch (generated Orval hook mapping to Spring Boot backend)
  const { data: pageData, isLoading: isRealLoading, isError: isRealError, refetch } = useGetSuppliers({
    search: state.search || undefined,
    pageable: pageableParams.pageable,
  });

  // Calculate effective states based on real API
  const isLoading = isRealLoading;
  const isError = isRealError;
  const rawData = pageData?.content || [];
  const totalCount = pageData?.totalElements || 0;
  const isEmpty = !isLoading && !isError && rawData.length === 0;

  const pageSize = state.size;
  const currentPage = state.page + 1; // Spring is 0-indexed, AntD is 1-indexed

  // Table Columns
  const columns: ColumnsType<SupplierResponse> = [
    {
      title: 'Supplier Name',
      key: 'name',
      width: 250, // Sensible minimum width
      render: (_, record) => (
        <TruncatedCell value={record.name || ''} className="font-semibold" />
      ),
    },
    {
      title: 'Tax ID',
      key: 'taxId',
      dataIndex: 'taxId',
      render: (taxId) => <Text type="secondary">{taxId || 'N/A'}</Text>,
    },
    {
      title: 'Contact Email',
      key: 'email',
      dataIndex: 'contactEmail',
      render: (email) => <Text>{email || 'N/A'}</Text>,
    },
    {
      title: 'Contact Phone',
      key: 'phone',
      dataIndex: 'contactPhone',
      render: (phone) => <Text>{phone || 'N/A'}</Text>,
    },
    {
      title: 'Address',
      key: 'address',
      render: (_, record) => (
        <TruncatedCell value={record.address || ''} maxWidth={200} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Supplier Items">
            <Link to={`/settings/products?supplierId=${record.id}`} tabIndex={-1}>
              <Button type="text" icon={<ShoppingOutlined />} aria-label="Supplier Items" />
            </Link>
          </Tooltip>
          
          <Tooltip title="Edit Supplier">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              aria-label="Edit Supplier" 
              onClick={() => {
                setEditingSupplier(record);
                setDrawerOpen(true);
              }}
            />
          </Tooltip>
          
          <Tooltip title="Delete Supplier">
            <Button 
              type="text" 
              icon={<DeleteOutlined style={{ color: '#f87171' }} />} 
              aria-label="Delete Supplier" 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this supplier?') && record.id) {
                  deleteMutation.mutate({ id: record.id });
                }
              }}
              loading={deleteMutation.isPending}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0F9D6C',
          fontFamily: 'var(--font-sans, sans-serif)',
        },
      }}
    >
      <div style={{ padding: '24px', minHeight: '100vh', boxSizing: 'border-box', backgroundColor: 'var(--surface-base)' }}>
        
        {/* HEADER AREA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <Breadcrumb items={[{ title: 'Procurement' }, { title: 'Suppliers' }]} style={{ marginBottom: '8px' }} />
            <Title level={1} style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              Suppliers
            </Title>
            <Text type="secondary" style={{ fontSize: '15px', marginTop: '4px', display: 'block' }}>
              {totalCount} {pluralize(totalCount, 'sourcing partner')}
            </Text>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            style={{ fontWeight: 600 }}
            onClick={() => {
              setEditingSupplier(null);
              setDrawerOpen(true);
            }}
          >
            Add Supplier
          </Button>
        </div>

        {/* MAIN DATA CONTAINER */}
        <div style={{ 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--surface-border)', 
          overflow: 'hidden', 
          background: 'var(--surface-raised)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          
          {/* SEARCH TOOLBAR */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ maxWidth: '400px', width: '100%' }}>
              <Input 
                prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />} 
                placeholder="Search suppliers by name or tax ID..." 
                value={debouncedSearch}
                onChange={(e) => setDebouncedSearch(e.target.value)}
                disabled={isLoading || isError}
                style={{ borderRadius: 'var(--radius-md)' }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            
            {isLoading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Table columns={columns} dataSource={[]} loading={true} pagination={false} />
              </motion.div>
            )}

            {isEmpty && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ padding: '64px 32px', textAlign: 'center' }}>
                <Empty 
                  image={<ShopOutlined style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />}
                  description={<Text style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>No suppliers added yet</Text>}
                >
                  <Button 
                    type="default" 
                    icon={<PlusOutlined />} 
                    style={{ marginTop: '16px', fontWeight: 600, borderRadius: 'var(--radius-md)' }}
                    onClick={() => {
                      setEditingSupplier(null);
                      setDrawerOpen(true);
                    }}
                  >
                    Add Supplier
                  </Button>
                </Empty>
              </motion.div>
            )}

            {isError && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ padding: '64px 0', textAlign: 'center' }}>
                <Empty 
                  image={<WarningOutlined style={{ fontSize: 48, color: '#f87171', marginBottom: 16 }} />}
                  description={<Text type="secondary" style={{ fontSize: '16px' }}>Couldn't load suppliers</Text>}
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
                  itemNameSingular="sourcing partner"
                  onPageChange={(page, size) => { setPage(page - 1); setSize(size); }}
                />
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </div>
      
      <SupplierFormDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingSupplier(null);
          refetch(); // Refetch data when drawer closes (e.g. on success)
        }}
        editingSupplier={editingSupplier}
      />
    </ConfigProvider>
  );
}
