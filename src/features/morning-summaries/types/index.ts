export interface MorningSummaryItem {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  estimateValue?: number;
  expectedReturnAmount?: number;
  expectedReturnPrice?: number;
}

export interface MorningSummary {
  id: number;
  summaryNumber: string;
  summaryDate: string;
  finalEstimateValue: number;
  status: 'PENDING' | 'SETTLED' | 'CANCELLED';
  repId: number;
  repName: string;
  driverId: number;
  driverName: string;
  items: MorningSummaryItem[];
}

export interface MorningSummaryRequest {
  repId: number;
  driverId: number;
  items: MorningSummaryItemRequest[];
}

export interface MorningSummaryItemRequest {
  productId: number;
  quantity: number;
  expectedReturnAmount?: number;
  expectedReturnPrice?: number;
}
