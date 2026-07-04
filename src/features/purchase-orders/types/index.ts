/**
 * Local TypeScript types for the Purchase Orders feature slice.
 * These extend / mirror the backend PurchasingDashboardResponse shapes
 * until Orval regenerates with the new openapi.yaml.
 */

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ORDERED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CLOSED';

export interface AgingBucket {
  bucketLabel: string;
  orderCount: number;
  totalValue: number;
}

export interface SupplierLeadTime {
  supplierId: number;
  supplierName: string;
  totalOrders: number;
  completedOrders: number;
  averageLeadTimeDays: number;
}

export interface OpenPurchaseOrderProjection {
  poNumber: string;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  ageInDays: number;
}

export interface PurchasingDashboardData {
  totalOpenOrders: number;
  totalOpenOrderValue: number;
  totalReceivedMonthValue: number;
  averageSupplierLeadTimeDays: number;
  agingBuckets: AgingBucket[];
  supplierLeadTimes: SupplierLeadTime[];
  recentOpenOrders: OpenPurchaseOrderProjection[];
}
