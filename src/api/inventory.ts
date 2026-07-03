import apiClient from './client';
import type { PageResponse } from '../types/api';
import type {
  Product,
  ProductCategory,
  Supplier,
  Warehouse,
  InventoryItem,
  InventoryTransaction,
} from '../types/inventory';

// ─── Product Categories ───────────────────────────────────────────────────────
export const categoryApi = {
  list: (params?: { search?: string; page?: number; size?: number }) =>
    apiClient
      .get<PageResponse<ProductCategory>>('/api/v1/product-categories', { params })
      .then((r) => r.data),
  get: (id: string) =>
    apiClient.get<ProductCategory>(`/api/v1/product-categories/${id}`).then((r) => r.data),
  create: (data: { name: string; description?: string }) =>
    apiClient.post<ProductCategory>('/api/v1/product-categories', data).then((r) => r.data),
  update: (id: string, data: { name: string; description?: string }) =>
    apiClient.put<ProductCategory>(`/api/v1/product-categories/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/api/v1/product-categories/${id}`),
};

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const supplierApi = {
  list: (params?: { search?: string; page?: number; size?: number }) =>
    apiClient
      .get<PageResponse<Supplier>>('/api/v1/suppliers', { params })
      .then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Supplier>(`/api/v1/suppliers/${id}`).then((r) => r.data),
  create: (data: Partial<Supplier>) =>
    apiClient.post<Supplier>('/api/v1/suppliers', data).then((r) => r.data),
  update: (id: string, data: Partial<Supplier>) =>
    apiClient.put<Supplier>(`/api/v1/suppliers/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/api/v1/suppliers/${id}`),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productApi = {
  list: (params?: { search?: string; page?: number; size?: number }) =>
    apiClient
      .get<PageResponse<Product>>('/api/v1/products', { params })
      .then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Product>(`/api/v1/products/${id}`).then((r) => r.data),
  create: (data: Partial<Product> & { categoryId?: string; supplierId?: string }) =>
    apiClient.post<Product>('/api/v1/products', data).then((r) => r.data),
  update: (
    id: string,
    data: Partial<Product> & { categoryId?: string; supplierId?: string }
  ) => apiClient.put<Product>(`/api/v1/products/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/api/v1/products/${id}`),
};

// ─── Warehouses ───────────────────────────────────────────────────────────────
export const warehouseApi = {
  list: (params?: { search?: string; page?: number; size?: number }) =>
    apiClient
      .get<PageResponse<Warehouse>>('/api/v1/warehouses', { params })
      .then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Warehouse>(`/api/v1/warehouses/${id}`).then((r) => r.data),
  create: (data: Partial<Warehouse>) =>
    apiClient.post<Warehouse>('/api/v1/warehouses', data).then((r) => r.data),
  update: (id: string, data: Partial<Warehouse>) =>
    apiClient.put<Warehouse>(`/api/v1/warehouses/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/api/v1/warehouses/${id}`),
};

// ─── Inventory Items ──────────────────────────────────────────────────────────
export const inventoryItemApi = {
  list: (params?: {
    warehouseId?: string;
    productId?: string;
    page?: number;
    size?: number;
  }) =>
    apiClient
      .get<PageResponse<InventoryItem>>('/api/v1/inventory-items', { params })
      .then((r) => r.data),
  transfer: (data: {
    sourceInventoryItemId: string;
    targetWarehouseId: string;
    quantity: number;
    notes?: string;
  }) => apiClient.post('/api/v1/inventory-items/transfer', data).then((r) => r.data),
  markDamaged: (data: {
    inventoryItemId: string;
    quantity: number;
    reason?: string;
  }) => apiClient.post('/api/v1/inventory-items/mark-damaged', data).then((r) => r.data),
};

// ─── Inventory Transactions ───────────────────────────────────────────────────
export const inventoryTransactionApi = {
  list: (params?: {
    inventoryItemId?: string;
    type?: string;
    page?: number;
    size?: number;
  }) =>
    apiClient
      .get<PageResponse<InventoryTransaction>>('/api/v1/inventory-transactions', {
        params,
      })
      .then((r) => r.data),
};
