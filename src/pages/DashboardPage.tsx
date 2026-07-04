import { Tabs, Spin, Alert, Button } from 'antd';
import {
  DashboardOutlined,
  DollarOutlined,
  InboxOutlined,
  CarOutlined,
  ShoppingOutlined,
  BankOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  useInventoryDashboard,
  useLogisticsDashboard,
  useSalesDashboard,
  useFinanceDashboard,
  usePurchasingDashboard,
} from '@/features/dashboard/hooks/useOperationalDashboards';
import {
  ExecutiveOverviewTab,
  SalesReceivablesTab,
  InventoryWarehouseTab,
  LogisticsDispatchTab,
  PurchasingSuppliersTab,
  FinanceLedgerTab,
} from '@/features/dashboard/components';
import '@/features/dashboard/components/dashboard.css';

export function DashboardPage() {
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

  const handleRefreshAll = () => {
    inventoryQuery.refetch();
    logisticsQuery.refetch();
    salesQuery.refetch();
    financeQuery.refetch();
    purchasingQuery.refetch();
  };

  const items = [
    {
      key: 'overview',
      label: (
        <span>
          <DashboardOutlined /> Executive Overview
        </span>
      ),
      children: (
        <ExecutiveOverviewTab
          inventory={inventoryQuery.data}
          logistics={logisticsQuery.data}
          sales={salesQuery.data}
          finance={financeQuery.data}
          purchasing={purchasingQuery.data}
          loading={isLoading}
        />
      ),
    },
    {
      key: 'sales',
      label: (
        <span>
          <DollarOutlined /> Sales & Receivables
        </span>
      ),
      children: <SalesReceivablesTab data={salesQuery.data} />,
    },
    {
      key: 'inventory',
      label: (
        <span>
          <InboxOutlined /> Inventory & Warehouse
        </span>
      ),
      children: <InventoryWarehouseTab data={inventoryQuery.data} />,
    },
    {
      key: 'logistics',
      label: (
        <span>
          <CarOutlined /> Logistics & Dispatch
        </span>
      ),
      children: <LogisticsDispatchTab data={logisticsQuery.data} />,
    },
    {
      key: 'purchasing',
      label: (
        <span>
          <ShoppingOutlined /> Purchasing & Suppliers
        </span>
      ),
      children: <PurchasingSuppliersTab data={purchasingQuery.data} />,
    },
    {
      key: 'finance',
      label: (
        <span>
          <BankOutlined /> Finance & Ledger
        </span>
      ),
      children: <FinanceLedgerTab data={financeQuery.data} />,
    },
  ];

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#e6edf3', margin: 0 }}>
            Operational Command Center
          </h1>
          <p style={{ color: '#8b949e', margin: '4px 0 0 0', fontSize: '0.95rem' }}>
            Real-time CQRS read-model intelligence across sales, warehouse, dispatch, purchasing, and financial ledger
          </p>
        </div>
        <div>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRefreshAll}
            loading={isLoading}
            style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 600, height: 40, padding: '0 20px' }}
          >
            Refresh Feed
          </Button>
        </div>
      </div>

      {isError && (
        <Alert
          type="error"
          message="Failed to load some dashboard feeds"
          description="Please check your network connection or backend service status."
          showIcon
          style={{ marginBottom: 20, borderRadius: 12, background: 'rgba(248, 113, 113, 0.1)', borderColor: '#f87171' }}
        />
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" tip="Loading real-time operational intelligence..." />
        </div>
      ) : (
        <Tabs defaultActiveKey="overview" items={items} className="command-center-tabs" />
      )}
    </div>
  );
}
