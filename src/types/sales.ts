import type { Product } from './inventory';

export interface Rep {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  route?: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  licenseNo?: string;
  vehicleNo?: string;
  createdAt: string;
}

export interface Shop {
  id: string;
  name: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  rep?: Rep;
  outstandingLoan: number;
  createdAt: string;
}

export interface RepOrderItem {
  id: string;
  product: Product;
  quantity: number;
  unitType: string;
  rate: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  isFreeItem: boolean;
  boxesNeeded: number;
}

export interface RepOrderShop {
  id: string;
  shop: Shop;
  items: RepOrderItem[];
}

export interface RepOrder {
  id: string;
  repId: string;
  repName: string;
  orderNumber: string;
  orderDate: string;
  loadingStatus: 'DRAFT' | 'LOADING_SHEET_CREATED';
  status: string;
  netAmount: number;
  shops: RepOrderShop[];
  createdAt: string;
}

export interface LoadingSheetItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface LoadingSheetReturn {
  id: string;
  product: Product;
  quantity: number;
}

export interface LoadingSheet {
  id: string;
  repOrder: RepOrder;
  driver: Driver;
  status: 'DRAFT' | 'CONFIRMED';
  items: LoadingSheetItem[];
  returns: LoadingSheetReturn[];
  createdAt: string;
}

export type PaymentMethod = 'CASH' | 'CHEQUE' | 'BANK_TRANSFER';

export interface DeliveryPayment {
  id: string;
  paymentMethod: PaymentMethod;
  amount: number;
  referenceNo?: string;
  notes?: string;
}

export interface DeliveryShopItem {
  id: string;
  product: Product;
  quantityDelivered: number;
}

export interface DeliveryShopReturn {
  id: string;
  product: Product;
  quantityReturned: number;
}

export interface DeliveryShop {
  id: string;
  shop: Shop;
  grossBillAmount: number;
  totalDiscount: number;
  returnsDeducted: number;
  netPayable: number;
  paidAmount: number;
  creditAmount: number;
  items: DeliveryShopItem[];
  returns: DeliveryShopReturn[];
  payments: DeliveryPayment[];
}

export interface Delivery {
  id: string;
  loadingSheet: LoadingSheet;
  status: 'IN_PROGRESS' | 'COMPLETED';
  shops: DeliveryShop[];
  createdAt: string;
}

export interface Purchase {
  id: string;
  invoiceNo: string;
  supplier?: { id: string; name: string };
  supplierName?: string;
  purchaseDate?: string;
  invoiceDate?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | string;
  totalAmount?: number;
  netAmount?: number;
  totalOrderValue?: number;
  discountAmount?: number;
  returnsDeductedAmount?: number;
  vatAmount?: number;
  paymentMethod?: string;
  chequeNo?: string;
  chequeBankName?: string;
  chequeAmount?: number;
  notes?: string;
  lineItems: PurchaseLineItem[];
  createdAt?: string;
}

export interface PurchaseLineItem {
  id?: string;
  product?: Product;
  productSku?: string;
  productName?: string;
  quantity?: number;
  soldQuantity?: number;
  noOfBoxes?: number;
  unitType?: string;
  unitCost?: number;
  rate?: number;
  totalCost?: number;
  amount?: number;
  warehouseId?: string;
}
