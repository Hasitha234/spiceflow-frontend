export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  basePrice: number;
  unitOfMeasure: string;
  netWeight?: string;
  unitType: string;
  boxConfiguration?: string;
  itemsPerSoldUnit?: number;
  soldUnitsPerBox?: number;
  ratePerSoldUnit?: number;
  category?: ProductCategory;
  supplier?: Supplier;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  storeType: 'MAIN' | 'VEHICLE' | 'CUSTOM';
  location?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productCategoryName: string;
  productBasePrice: number;
  unitOfMeasure: string;
  itemsPerSoldUnit?: number;
  soldUnitsPerBox?: number;
  warehouseId: string;
  warehouseName: string;
  quantityAvailable: number;
  quantityReserved: number;
  batchNumber?: string;
  expirationDate?: string;
}

export interface InventoryTransaction {
  id: string;
  inventoryItem: InventoryItem;
  transactionType: 'IN' | 'OUT' | 'RESERVE' | 'RELEASE';
  quantity: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  createdAt: string;
}
