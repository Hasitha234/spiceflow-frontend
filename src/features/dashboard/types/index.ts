export interface LowStockItem {
  productId: number;
  sku: string;
  name: string;
  quantityAvailable: number;
  unitOfMeasure: string;
  basePrice: number;
}

export interface RecentMovement {
  id: number;
  movementType: string;
  productId: number;
  productName: string;
  quantity: number;
  totalValue: number;
  referenceId: string;
  timestamp: string;
  performedBy: string;
}

export interface WarehouseStock {
  warehouseId: number;
  warehouseName: string;
  location: string;
  totalValue: number;
  itemCount: number;
}

export interface InventoryDashboardData {
  totalStockValue: number;
  totalItemsCount: number;
  lowStockCount: number;
  pendingTransfersCount: number;
  lowStockItems: LowStockItem[];
  recentMovements: RecentMovement[];
  warehouseStocks: WarehouseStock[];
}

export interface ActiveLoadingSheet {
  id: number;
  sheetNumber: string;
  driverId: number;
  driverName: string;
  status: string;
  loadingDate: string;
  itemCount: number;
}

export interface InProgressDelivery {
  id: number;
  deliveryNumber: string;
  loadingSheetNumber: string;
  driverName: string;
  status: string;
  deliveryDate: string;
  shopCount: number;
}

export interface LogisticsDashboardData {
  activeLoadingSheetsCount: number;
  inProgressDeliveriesCount: number;
  completedDeliveriesToday: number;
  totalReturnItemsToday: number;
  activeLoadingSheets: ActiveLoadingSheet[];
  inProgressDeliveries: InProgressDelivery[];
}

export interface RecentRepOrder {
  id: number;
  orderNumber: string;
  repId: number;
  repName: string;
  status: string;
  orderDate: string;
  totalAmount: number;
  shopCount: number;
}

export interface TopDebtorShop {
  shopId: number;
  shopName: string;
  ownerName: string;
  phone: string;
  area: string;
  outstandingLoan: number;
}

export interface SalesDashboardData {
  todaySalesValue: number;
  monthSalesValue: number;
  monthCollectionsValue: number;
  totalOutstandingLoans: number;
  recentOrders: RecentRepOrder[];
  topDebtorShops: TopDebtorShop[];
}

export interface ReceivableAgingBucket {
  bucketLabel: string;
  shopCount: number;
  totalAmount: number;
}

export interface RecentFinancialTransaction {
  id: number;
  transactionType: string;
  referenceNumber: string;
  partyName: string;
  amount: number;
  paymentMethod: string;
  timestamp: string;
  status: string;
}

export interface FinanceDashboardData {
  totalReceivables: number;
  totalPayables: number;
  netCashFlowMonth: number;
  totalCollectionsMonth: number;
  receivablesAgingBuckets: ReceivableAgingBucket[];
  recentTransactions: RecentFinancialTransaction[];
}
