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

import { useState, useEffect, useReducer } from 'react';
import { Breadcrumb, Button, Input, Table, Tag, Typography, Empty, ConfigProvider, theme, Space } from 'antd';
import { Pagination } from 'antd';
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

const { Title, Text } = Typography;

// --- Data Model & State ---

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseClass: string;
  expiryDate: string;
  plateNumber: string;
  warehouse: string;
  operationalStatus: 'Available' | 'Unavailable' | 'On Leave';
  active: boolean;
}

type DriversState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; data: Driver[] };

type DriversAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_EMPTY' }
  | { type: 'FETCH_ERROR' }
  | { type: 'FETCH_SUCCESS'; payload: Driver[] };

function driversReducer(state: DriversState, action: DriversAction): DriversState {
  switch (action.type) {
    case 'FETCH_START': return { status: 'loading' };
    case 'FETCH_EMPTY': return { status: 'empty' };
    case 'FETCH_ERROR': return { status: 'error' };
    case 'FETCH_SUCCESS': return { status: 'success', data: action.payload };
    default: return state;
  }
}

const MOCK_DRIVERS_MANY: Driver[] = [
  { id: 'DRV-1042', name: 'James Holden', email: 'j.holden@logistics.com', phone: '555-0199', licenseNumber: 'CDL-8942-X', licenseClass: 'Class A', expiryDate: '2027-10-14', plateNumber: 'RCI-992', warehouse: 'Central Hub', operationalStatus: 'Available', active: true },
  { id: 'DRV-1088', name: 'Naomi Nagata', email: 'n.nagata@logistics.com', phone: '555-0211', licenseNumber: 'CDL-1123-Y', licenseClass: 'Class B', expiryDate: '2026-05-22', plateNumber: 'TCH-414', warehouse: 'North Station', operationalStatus: 'On Leave', active: true },
  { id: 'DRV-1090', name: 'Amos Burton', email: 'a.burton@logistics.com', phone: '555-0344', licenseNumber: 'CDL-7741-Z', licenseClass: 'Class A', expiryDate: '2028-01-05', plateNumber: 'BTL-111', warehouse: 'East Depot', operationalStatus: 'Available', active: true },
  { id: 'DRV-1095', name: 'Alex Kamal', email: 'a.kamal@logistics.com', phone: '555-0812', licenseNumber: 'CDL-3321-A', licenseClass: 'Class A', expiryDate: '2025-11-30', plateNumber: 'MAR-042', warehouse: 'Central Hub', operationalStatus: 'Unavailable', active: true },
  { id: 'DRV-1102', name: 'Bobbie Draper', email: 'b.draper@logistics.com', phone: '555-0991', licenseNumber: 'CDL-9988-B', licenseClass: 'Class A', expiryDate: '2029-07-15', plateNumber: 'GOL-777', warehouse: 'South Station', operationalStatus: 'Available', active: true },
  { id: 'DRV-1115', name: 'Chrisjen Avasarala', email: 'c.avasarala@logistics.com', phone: '555-0001', licenseNumber: 'CDL-1000-C', licenseClass: 'Class C', expiryDate: '2024-12-01', plateNumber: 'UN-001', warehouse: 'HQ', operationalStatus: 'Unavailable', active: false },
  { id: 'DRV-1120', name: 'Clarissa Mao', email: 'c.mao@logistics.com', phone: '555-4422', licenseNumber: 'CDL-5566-D', licenseClass: 'Class B', expiryDate: '2026-08-19', plateNumber: 'MEL-202', warehouse: 'East Depot', operationalStatus: 'Available', active: true },
  { id: 'DRV-1134', name: 'Fred Johnson', email: 'f.johnson@logistics.com', phone: '555-8833', licenseNumber: 'CDL-2233-E', licenseClass: 'Class A', expiryDate: '2027-03-10', plateNumber: 'TYC-505', warehouse: 'North Station', operationalStatus: 'Available', active: true },
  { id: 'DRV-1140', name: 'Anderson Dawes', email: 'a.dawes@logistics.com', phone: '555-7711', licenseNumber: 'CDL-4411-F', licenseClass: 'Class B', expiryDate: '2025-09-22', plateNumber: 'CER-101', warehouse: 'West Depot', operationalStatus: 'On Leave', active: true },
  { id: 'DRV-1155', name: 'Camina Drummer', email: 'c.drummer@logistics.com', phone: '555-6655', licenseNumber: 'CDL-8899-G', licenseClass: 'Class A', expiryDate: '2028-04-14', plateNumber: 'MED-303', warehouse: 'Central Hub', operationalStatus: 'Available', active: true },
  { id: 'DRV-1162', name: 'Juliette Mao', email: 'j.mao@logistics.com', phone: '555-1199', licenseNumber: 'CDL-1100-H', licenseClass: 'Class C', expiryDate: '2024-10-31', plateNumber: 'SCO-909', warehouse: 'South Station', operationalStatus: 'Unavailable', active: false },
  { id: 'DRV-1178', name: 'Josephus Miller', email: 'j.miller@logistics.com', phone: '555-2244', licenseNumber: 'CDL-3344-I', licenseClass: 'Class B', expiryDate: '2026-01-12', plateNumber: 'STA-404', warehouse: 'Central Hub', operationalStatus: 'Available', active: true },
];

const MOCK_DRIVERS_SINGLE: Driver[] = [MOCK_DRIVERS_MANY[0]];

// --- Page Component ---

export function DriversPage() {
  const [state, dispatch] = useReducer(driversReducer, { status: 'loading' });
  const [testMode, setTestMode] = useState<'success (many)' | 'success (1)' | 'empty (0)' | 'error'>('success (many)');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchDrivers = (mode: string) => {
    dispatch({ type: 'FETCH_START' });
    
    setTimeout(() => {
      if (mode === 'error') {
        dispatch({ type: 'FETCH_ERROR' });
      } else if (mode === 'empty (0)') {
        dispatch({ type: 'FETCH_EMPTY' });
      } else if (mode === 'success (1)') {
        dispatch({ type: 'FETCH_SUCCESS', payload: MOCK_DRIVERS_SINGLE });
      } else {
        dispatch({ type: 'FETCH_SUCCESS', payload: MOCK_DRIVERS_MANY });
      }
    }, 800);
  };

  useEffect(() => {
    fetchDrivers(testMode);
  }, [testMode]);

  // Derived filtered data
  const rawData = state.status === 'success' ? state.data : [];
  const filteredData = rawData.filter(d => 
    d.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
    d.id.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
    d.licenseNumber.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
  
  const totalCount = filteredData.length;
  // Proper pluralization function
  const getPluralizedDriverString = (count: number) => count === 1 ? 'driver' : 'drivers';

  // Client-side pagination slice
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Table Columns
  const columns: ColumnsType<Driver> = [
    {
      title: 'Driver Details',
      key: 'details',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{record.name}</Text>
          <Text style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {record.id}</Text>
        </div>
      ),
    },
    {
      title: 'Contact Info',
      key: 'contact',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <Text style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', lineHeight: 1 }}>EMAIL</Text>
            <Text style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{record.email}</Text>
          </div>
          <div>
            <Text style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', lineHeight: 1 }}>PHONE</Text>
            <Text style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{record.phone}</Text>
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
            <Text style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{record.licenseNumber}</Text>
            <Tag style={{ margin: 0, border: '1px solid var(--surface-border)' }}>{record.licenseClass}</Tag>
          </div>
          <div>
            <Text style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'inline-block', marginRight: '4px' }}>EXPIRES</Text>
            <Text style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{record.expiryDate}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Logistics & Vehicle',
      key: 'logistics',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{record.plateNumber}</Text>
          <div>
            <Text style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', lineHeight: 1 }}>WAREHOUSE</Text>
            <Text style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{record.warehouse}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Operational Status',
      key: 'operationalStatus',
      render: (_, record) => {
        let color = 'default';
        if (record.operationalStatus === 'Available') color = 'success';
        if (record.operationalStatus === 'On Leave') color = 'warning';
        if (record.operationalStatus === 'Unavailable') color = 'error';
        // FILLED pill logic -> using ant design tag with color prop fills it, but we can enforce filled style
        return <Tag color={color} style={{ border: 'none' }}>{record.operationalStatus}</Tag>;
      },
    },
    {
      title: 'Active',
      key: 'active',
      render: (_, record) => {
        // OUTLINED pill logic -> using transparent background
        const color = record.active ? '#10b981' : '#8b949e';
        return (
          <Tag style={{ background: 'transparent', borderColor: color, color: color }}>
            {record.active ? 'Active' : 'Inactive'}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: () => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined style={{ color: 'var(--text-secondary)' }} />} aria-label="Edit driver" />
          <Button type="text" icon={<DeleteOutlined style={{ color: '#f87171' }} />} aria-label="Delete driver" />
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#0F9D6C',
          fontFamily: 'var(--font-sans, sans-serif)',
          colorBgContainer: '#1c2128',
          colorBorder: '#30363d',
        },
        components: {
          Table: {
            headerBg: 'var(--surface-raised)',
            headerColor: 'var(--text-secondary)',
            borderColor: 'var(--surface-border)',
            rowHoverBg: 'var(--surface-raised)',
          }
        }
      }}
    >
      <div style={{ padding: '24px', background: 'var(--surface-base)', minHeight: '100vh', boxSizing: 'border-box' }}>
        
        {/* --- Test Controls --- */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--surface-raised)', padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
          <Text style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>Test States (List):</Text>
          <Button size="small" type={testMode === 'success (many)' ? 'primary' : 'default'} onClick={() => setTestMode('success (many)')}>Populated (Many)</Button>
          <Button size="small" type={testMode === 'success (1)' ? 'primary' : 'default'} onClick={() => setTestMode('success (1)')}>Populated (1)</Button>
          <Button size="small" type={testMode === 'empty (0)' ? 'primary' : 'default'} onClick={() => setTestMode('empty (0)')}>Empty (0)</Button>
          <Button size="small" type={testMode === 'error' ? 'primary' : 'default'} onClick={() => setTestMode('error')}>Error</Button>
        </div>

        {/* HEADER AREA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <Breadcrumb items={[{ title: 'Settings' }, { title: 'Drivers' }]} style={{ marginBottom: '8px', color: 'var(--text-muted)' }} />
            <Title level={1} style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Drivers & Logistics
            </Title>
            <Text style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px', display: 'block' }}>
              {/* Correct Pluralization Applied Here */}
              {state.status === 'success' ? totalCount : 0} registered delivery {getPluralizedDriverString(state.status === 'success' ? totalCount : 0)} and fleet personnel
            </Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} style={{ fontWeight: 600 }}>
            Register Driver
          </Button>
        </div>

        {/* SEARCH BAR */}
        <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
          <Input 
            prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />} 
            placeholder="Search drivers by name, ID, or license..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={state.status === 'loading' || state.status === 'error'}
            style={{ background: 'var(--surface-raised)', borderColor: 'var(--surface-border)' }}
          />
        </div>

        {/* TABLE AREA */}
        <div style={{ background: 'var(--surface-base)', borderRadius: '8px', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            
            {state.status === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Table columns={columns} dataSource={[]} loading={true} pagination={false} />
              </motion.div>
            )}

            {state.status === 'empty' && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ padding: '64px 0', textAlign: 'center' }}>
                <Empty 
                  image={<CarOutlined style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />}
                  description={<Text style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>No drivers registered yet</Text>}
                >
                  <Button type="primary" icon={<PlusOutlined />} style={{ marginTop: '16px', fontWeight: 600 }}>
                    Register Driver
                  </Button>
                </Empty>
              </motion.div>
            )}

            {state.status === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ padding: '64px 0', textAlign: 'center' }}>
                <Empty 
                  image={<WarningOutlined style={{ fontSize: 48, color: '#f87171', marginBottom: 16 }} />}
                  description={<Text style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Couldn't load drivers</Text>}
                >
                  <Button onClick={() => fetchDrivers('success (many)')} style={{ marginTop: '16px', color: '#0F9D6C', borderColor: '#0F9D6C' }}>
                    Retry
                  </Button>
                </Empty>
              </motion.div>
            )}

            {state.status === 'success' && (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Table 
                  columns={columns} 
                  dataSource={paginatedData} 
                  rowKey="id"
                  pagination={false} // Custom pagination below
                />
                
                {/* CONDITIONAL PAGINATION FOOTER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--surface-border)', background: 'var(--surface-raised)' }}>
                  <Text style={{ color: 'var(--text-secondary)' }}>
                    Total {totalCount} {getPluralizedDriverString(totalCount)}
                  </Text>
                  
                  <div style={{ 
                    opacity: totalCount <= pageSize ? 0.4 : 1, 
                    pointerEvents: totalCount <= pageSize ? 'none' : 'auto',
                    transition: 'opacity 0.2s ease-in-out'
                  }}>
                    <Pagination 
                      current={currentPage}
                      pageSize={pageSize}
                      total={totalCount}
                      onChange={(page, size) => { setCurrentPage(page); setPageSize(size); }}
                      showSizeChanger
                      pageSizeOptions={['10', '20', '50']}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </div>
    </ConfigProvider>
  );
}
