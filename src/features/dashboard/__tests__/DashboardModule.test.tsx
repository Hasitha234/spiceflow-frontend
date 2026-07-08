import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { DollarOutlined } from '@ant-design/icons';
import {
  ExecutiveOverviewTab,
  SalesReceivablesTab,
  InventoryWarehouseTab,
  LogisticsDispatchTab,
  PurchasingSuppliersTab,
  FinanceLedgerTab,
} from '../components';
import { KpiStatCard as KpiCard } from '@/components/common/KpiStatCard';

// Mock Recharts since ResponsiveContainer requires actual DOM dimensions in jsdom
vi.mock('recharts', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-container" style={{ width: 500, height: 300 }}>
        {children}
      </div>
    ),
  };
});

describe('Dashboard Module Reference Tests', () => {
  it('renders KpiCard with title, value, badge, and footer', () => {
    render(
      <KpiCard
        title="Total Revenue"
        value="$125,000"
        icon={<DollarOutlined />}
        badgeText="+15%"
        badgeType="up"
        footerText="Compared to last month"
      />
    );

    expect(screen.getByText('Total Revenue')).toBeDefined();
    expect(screen.getByText('$125,000')).toBeDefined();
    expect(screen.getByText('+15%')).toBeDefined();
    expect(screen.getByText('Compared to last month')).toBeDefined();
  });

  it('renders ExecutiveOverviewTab with KPI metrics', () => {
    render(
      <ExecutiveOverviewTab
        sales={{
          todaySalesValue: 1500,
          monthSalesValue: 45000,
          monthCollectionsValue: 40000,
          totalOutstandingLoans: 125000,
          recentOrders: [],
          topDebtorShops: [],
        }}
      />
    );

    expect(screen.getByText("Today's Sales")).toBeDefined();
    expect(screen.getByText('$1,500')).toBeDefined();
    expect(screen.getByText('Month Collections')).toBeDefined();
  });

  it('renders SalesReceivablesTab with debtor shops and orders', () => {
    render(
      <SalesReceivablesTab
        data={{
          todaySalesValue: 2000,
          monthSalesValue: 50000,
          monthCollectionsValue: 45000,
          totalOutstandingLoans: 10000,
          topDebtorShops: [
            {
              shopId: 1,
              shopName: 'Spice Corner',
              ownerName: 'John',
              phone: '555-0101',
              area: 'Downtown',
              outstandingLoan: 5000,
            },
          ],
          recentOrders: [],
        }}
      />
    );

    expect(screen.getByText('Spice Corner')).toBeDefined();
    expect(screen.getByText('Top Debtor Shops (Action Required)')).toBeDefined();
  });

  it('renders InventoryWarehouseTab with low stock items', () => {
    render(
      <InventoryWarehouseTab
        data={{
          warehouseStocks: [],
          totalStockValue: 80000,
          totalItemsCount: 150,
          lowStockCount: 2,
          pendingTransfersCount: 1,
          lowStockItems: [
            {
              productId: 10,
              sku: 'SKU-001',
              name: 'Black Pepper 500g',
              quantityAvailable: 3,
              unitOfMeasure: 'KG',
              basePrice: 12.5,
            },
          ],
          recentMovements: [],
        }}
      />
    );

    expect(screen.getByText('Black Pepper 500g')).toBeDefined();
    expect(screen.getByText('Low Stock Alerts (Restock Required)')).toBeDefined();
  });

  it('renders LogisticsDispatchTab with active loading sheets', () => {
    render(
      <LogisticsDispatchTab
        data={{
          activeLoadingSheetsCount: 3,
          inProgressDeliveriesCount: 5,
          completedDeliveriesToday: 12,
          totalReturnItemsToday: 1,
          activeLoadingSheets: [
            {
              id: 1,
              sheetNumber: 'LS-001',
              driverId: 5,
              driverName: 'Dave Driver',
              status: 'DISPATCHED',
              loadingDate: '2026-07-04',
              itemCount: 45,
            },
          ],
          inProgressDeliveries: [],
        }}
      />
    );

    expect(screen.getByText('LS-001')).toBeDefined();
    expect(screen.getByText('Dave Driver')).toBeDefined();
  });

  it('renders PurchasingSuppliersTab with supplier lead times', () => {
    render(
      <PurchasingSuppliersTab
        data={{
          totalOpenOrders: 4,
          totalOpenOrderValue: 25000,
          totalReceivedMonthValue: 60000,
          averageSupplierLeadTimeDays: 4.5,
          agingBuckets: [],
          supplierLeadTimes: [
            {
              supplierId: 1,
              supplierName: 'Colombo Spice Mills',
              totalOrders: 10,
              completedOrders: 9,
              averageLeadTimeDays: 4.5,
            },
          ],
          recentOpenOrders: [],
        }}
      />
    );

    expect(screen.getByText('Colombo Spice Mills')).toBeDefined();
    expect(screen.getByText('Supplier Lead Time Performance')).toBeDefined();
  });

  it('renders FinanceLedgerTab with transaction ledger', () => {
    render(
      <FinanceLedgerTab
        data={{
          totalReceivables: 120000,
          totalPayables: 60000,
          netCashFlowMonth: 30000,
          totalCollectionsMonth: 90000,
          receivablesAgingBuckets: [],
          recentTransactions: [
            {
              id: 1,
              transactionType: 'COLLECTION',
              referenceNumber: 'CC-010',
              partyName: 'Shop X',
              amount: 1500,
              paymentMethod: 'CASH',
              timestamp: '2026-07-04T10:00:00Z',
              status: 'CONFIRMED',
            },
          ],
        }}
      />
    );

    expect(screen.getByText('CC-010')).toBeDefined();
    expect(screen.getByText('Shop X')).toBeDefined();
    expect(screen.getByText('Chronological Financial Ledger (Live Feed)')).toBeDefined();
  });
});
