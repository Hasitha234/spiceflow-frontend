import React, { useState } from 'react';
import { Card, Tabs, Button, Skeleton, Empty, Row, Col, Typography, ConfigProvider } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DashboardOutlined,
  DollarOutlined,
  InboxOutlined,
  CarOutlined,
  ShoppingOutlined,
  BankOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  useInventoryDashboard,
  useLogisticsDashboard,
  useSalesDashboard,
  useFinanceDashboard,
  usePurchasingDashboard,
} from '@/features/dashboard/hooks/useOperationalDashboards';
import {
  SalesReceivablesTab,
  InventoryWarehouseTab,
  LogisticsDispatchTab,
  PurchasingSuppliersTab,
  FinanceLedgerTab,
} from '@/features/dashboard/components';
import { KpiStatCard } from '@/components/common/KpiStatCard';
import '@/features/dashboard/components/dashboard.css';

const { Title, Text } = Typography;

const NEUTRAL_ICON_COLOR = '#8b949e';

type KPIData = {
  id: number;
  title: string;
  value: React.ReactNode;
  tag: string;
  tagColor: string;
  desc: string;
  icon: React.ReactNode;
  emptyMessage: string;
};

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Real API hooks
  const inventoryQuery = useInventoryDashboard(10);
  const logisticsQuery = useLogisticsDashboard(10);
  const salesQuery = useSalesDashboard(10);
  const financeQuery = useFinanceDashboard(10);
  const purchasingQuery = usePurchasingDashboard(10);

  const isLoading =
    inventoryQuery.isLoading ||
    logisticsQuery.isLoading ||
    salesQuery.isLoading ||
    financeQuery.isLoading ||
    purchasingQuery.isLoading;

  const isError =
    inventoryQuery.isError ||
    logisticsQuery.isError ||
    salesQuery.isError ||
    financeQuery.isError ||
    purchasingQuery.isError;

  const handleRefresh = () => {
    inventoryQuery.refetch();
    logisticsQuery.refetch();
    salesQuery.refetch();
    financeQuery.refetch();
    purchasingQuery.refetch();
  };

  const salesData = salesQuery.data;
  const financeData = financeQuery.data;
  const inventoryData = inventoryQuery.data;
  const logisticsData = logisticsQuery.data;

  const formatDashboardCurrency = (val: number | undefined) => {
    if (val == null) return <><span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#64748B', marginRight: '0.25rem' }}>LKR</span>0.00</>;
    const numStr = new Intl.NumberFormat('en-LK', { style: 'decimal', minimumFractionDigits: 2 }).format(val);
    return (
      <>
        <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#64748B', marginRight: '0.25rem' }}>LKR</span>
        {numStr}
      </>
    );
  };

  // Map real data to KPI cards
  const kpiData: KPIData[] = [
    { 
      id: 1, title: "Today's Sales", 
      value: formatDashboardCurrency(salesData?.todaySalesValue), 
      tag: "Live Feed", tagColor: "green", desc: "Today", 
      icon: <DollarOutlined style={{ color: NEUTRAL_ICON_COLOR }} />, emptyMessage: "No sales recorded today." 
    },
    { 
      id: 2, title: "Month Collections", 
      value: formatDashboardCurrency(salesData?.monthCollectionsValue), 
      tag: "Inflows", tagColor: "green", desc: "Current Month", 
      icon: <BankOutlined style={{ color: NEUTRAL_ICON_COLOR }} />, emptyMessage: "No collections this month." 
    },
    { 
      id: 3, title: "Net Cash Flow", 
      value: formatDashboardCurrency(financeData?.netCashFlowMonth), 
      tag: financeData && financeData.netCashFlowMonth >= 0 ? "Positive" : "Negative", 
      tagColor: financeData && financeData.netCashFlowMonth >= 0 ? "green" : "red", 
      desc: "Current Month", icon: <DollarOutlined style={{ color: NEUTRAL_ICON_COLOR }} />, emptyMessage: "No cash flow data available." 
    },
    { 
      id: 4, title: "Total Stock Value", 
      value: formatDashboardCurrency(inventoryData?.totalStockValue), 
      tag: "Warehouse", tagColor: "blue", desc: `${inventoryData?.totalItemsCount || 0} items`, 
      icon: <InboxOutlined style={{ color: NEUTRAL_ICON_COLOR }} />, emptyMessage: "Warehouse is currently empty." 
    },
    { 
      id: 5, title: "Active Loading Sheets", 
      value: logisticsData ? `${logisticsData.activeLoadingSheetsCount}` : "0", 
      tag: "Dispatch", tagColor: "blue", desc: "Currently active", 
      icon: <CarOutlined style={{ color: NEUTRAL_ICON_COLOR }} />, emptyMessage: "No active loading sheets." 
    },
    { 
      id: 6, title: "In-Progress Deliveries", 
      value: logisticsData ? `${logisticsData.inProgressDeliveriesCount}` : "0", 
      tag: "Transit", tagColor: "blue", desc: "Out for delivery", 
      icon: <CarOutlined style={{ color: NEUTRAL_ICON_COLOR }} />, emptyMessage: "No deliveries in progress." 
    },
    { 
      id: 7, title: "Total Receivables", 
      value: formatDashboardCurrency(financeData?.totalReceivables), 
      tag: "Attention", tagColor: "orange", desc: "Net outstanding", 
      icon: <WarningOutlined style={{ color: NEUTRAL_ICON_COLOR }} />, emptyMessage: "No outstanding receivables." 
    },
    { 
      id: 8, title: "Open PO Payables", 
      value: formatDashboardCurrency(financeData?.totalPayables), 
      tag: "Outflows", tagColor: "red", desc: "Pending payment", 
      icon: <ShoppingOutlined style={{ color: NEUTRAL_ICON_COLOR }} />, emptyMessage: "No open purchase orders." 
    },
  ];

  // Map real data to chart (using the 6-month historical, but we'll mock the historical axis for now since API doesn't provide it directly in these endpoints, just use static for layout demo, wait the user said "remove mock data". If no chart data, hide it or use whatever is available)
  // Actually, I can use the recent transactions for receivables!
  
  const renderKPICard = (kpi: KPIData, index: number) => (
    <Col xs={24} sm={12} lg={6} key={`kpi-${index}`}>
      <KpiStatCard
        title={kpi.title}
        value={kpi.value}
        icon={kpi.icon}
        badgeText={kpi.tag}
        tagColor={kpi.tagColor}
        footerText={kpi.desc}
        status={isError ? 'error' : isLoading ? 'loading' : 'success'}
        onRetry={handleRefresh}
      />
    </Col>
  );

  const renderExecutiveOverview = () => (
    <motion.div 
      key="overview"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.15 }}
    >
      <Row gutter={[24, 24]}>
        {kpiData.map((kpi, i) => renderKPICard(kpi, i))}
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '48px' }}>
        {/* RECEIVABLES PANEL */}
        <Col xs={24}>
          <Card 
            title={<Text style={{ fontWeight: 600 }}>Top Debtor Shops</Text>}
            style={{ height: '400px' }}
            styles={{ body: { padding: '24px', height: '100%', overflowY: 'auto' } }}
          >
            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Skeleton active paragraph={{ rows: 6 }} title={false} />
                </motion.div>
              )}
              
              {!isLoading && !isError && (!salesData?.topDebtorShops || salesData.topDebtorShops.length === 0) && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    description={<Text type="secondary">No outstanding receivables</Text>}
                  />
                </motion.div>
              )}
              
              {isError && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                   <Empty 
                    image={<WarningOutlined style={{ fontSize: 48, color: '#f87171' }} />}
                    description={<Text type="secondary">Failed to load receivables.</Text>}
                  >
                    <Button onClick={handleRefresh}>Retry</Button>
                  </Empty>
                </motion.div>
              )}

              {!isLoading && !isError && salesData?.topDebtorShops && salesData.topDebtorShops.length > 0 && (
                <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {salesData.topDebtorShops.map((item) => (
                      <div key={item.shopId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                        <div>
                          <Text style={{ fontWeight: 600, display: 'block' }}>{item.shopName}</Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>{item.area} - {item.phone}</Text>
                        </div>
                        <Text style={{ fontWeight: 700 }}>{formatDashboardCurrency(item.outstandingLoan)}</Text>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </Col>
      </Row>
    </motion.div>
  );

  const tabsItems = [
    { key: 'overview', label: <span><DashboardOutlined /> Executive Overview</span>, children: renderExecutiveOverview() },
    { key: 'sales', label: <span><DollarOutlined /> Sales & Receivables</span>, children: <SalesReceivablesTab data={salesQuery.data} /> },
    { key: 'inventory', label: <span><InboxOutlined /> Inventory & Warehouse</span>, children: <InventoryWarehouseTab data={inventoryQuery.data} /> },
    { key: 'logistics', label: <span><CarOutlined /> Logistics & Dispatch</span>, children: <LogisticsDispatchTab data={logisticsQuery.data} /> },
    { key: 'purchasing', label: <span><ShoppingOutlined /> Purchasing & Suppliers</span>, children: <PurchasingSuppliersTab data={purchasingQuery.data} /> },
    { key: 'finance', label: <span><BankOutlined /> Finance & Ledger</span>, children: <FinanceLedgerTab data={financeQuery.data} /> },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0D9488',
          fontFamily: 'var(--font-sans, sans-serif)',
        },
      }}
    >
      <div style={{ padding: '24px', minHeight: '100vh', boxSizing: 'border-box' }}>
        
        {/* HEADER AREA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <Title level={1} style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              Operational Command Center
            </Title>
            <Text style={{ fontSize: '0.875rem', marginTop: '0.5rem', display: 'block', color: 'var(--text-secondary)' }}>
              Real-time overview of sales, inventory, and financial health.
            </Text>
          </div>
          
          <Button
            type="primary"
            onClick={handleRefresh}
            loading={isLoading}
            style={{ fontWeight: 600, height: '40px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Refresh Feed
          </Button>
        </div>

        {/* TABS */}
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabsItems} 
          tabBarStyle={{ marginBottom: '24px' }}
        />

      </div>
    </ConfigProvider>
  );
}
