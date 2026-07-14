import apiClient from './client';
import type { PageResponse } from '../types/api';
import type { Rep, Driver, Shop, RepOrder, LoadingSheet, Delivery, Purchase, EndOfDaySummary } from '../types/sales';

// ─── Master Data ──────────────────────────────────────────────────────────────
export const repApi = {
  list: (params?: { name?: string; page?: number; size?: number }) =>
    apiClient.get<PageResponse<Rep>>('/api/v1/sales/master-data/reps', { params }).then((r) => r.data),
  create: (data: Partial<Rep>) =>
    apiClient.post<Rep>('/api/v1/sales/master-data/reps', data).then((r) => r.data),
  update: (id: string, data: Partial<Rep>) =>
    apiClient.put<Rep>(`/api/v1/sales/master-data/reps/${id}`, data).then((r) => r.data),
};

export const driverApi = {
  list: (params?: { name?: string; page?: number; size?: number }) =>
    apiClient.get<PageResponse<Driver>>('/api/v1/sales/master-data/drivers', { params }).then((r) => r.data),
  create: (data: Partial<Driver>) =>
    apiClient.post<Driver>('/api/v1/sales/master-data/drivers', data).then((r) => r.data),
  update: (id: string, data: Partial<Driver>) =>
    apiClient.put<Driver>(`/api/v1/sales/master-data/drivers/${id}`, data).then((r) => r.data),
};

export const shopApi = {
  list: (params?: { name?: string; page?: number; size?: number }) =>
    apiClient.get<PageResponse<Shop>>('/api/v1/sales/master-data/shops', { params }).then((r) => r.data),
  create: (data: Partial<Shop> & { repId?: string }) =>
    apiClient.post<Shop>('/api/v1/sales/master-data/shops', data).then((r) => r.data),
  update: (id: string, data: Partial<Shop> & { repId?: string }) =>
    apiClient.put<Shop>(`/api/v1/sales/master-data/shops/${id}`, data).then((r) => r.data),
};

// ─── Rep Orders ───────────────────────────────────────────────────────────────
export const repOrderApi = {
  list: (params?: { repId?: string; date?: string; page?: number; size?: number }) =>
    apiClient.get<PageResponse<RepOrder>>('/api/v1/sales/rep-orders', { params }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<RepOrder>(`/api/v1/sales/rep-orders/${id}`).then((r) => r.data),
  create: (data: object) =>
    apiClient.post<RepOrder>('/api/v1/sales/rep-orders', data).then((r) => r.data),
};

// ─── Loading Sheets ───────────────────────────────────────────────────────────
export const loadingSheetApi = {
  list: (params?: { driverId?: string | number; status?: string; page?: number; size?: number }) =>
    apiClient.get<PageResponse<LoadingSheet>>('/api/v1/sales/loading-sheets', { params }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<LoadingSheet>(`/api/v1/sales/loading-sheets/${id}`).then((r) => r.data),
  create: (data: object) =>
    apiClient.post<LoadingSheet>('/api/v1/sales/loading-sheets', data).then((r) => r.data),
  confirm: (id: string) =>
    apiClient.post<LoadingSheet>(`/api/v1/sales/loading-sheets/${id}/confirm`).then((r) => r.data),
  cancel: (id: string, returnWarehouseId?: string | number) =>
    apiClient.post<LoadingSheet>(`/api/v1/sales/loading-sheets/${id}/cancel`, null, {
      params: returnWarehouseId ? { returnWarehouseId } : undefined,
    }).then((r) => r.data),
};

// ─── Deliveries ───────────────────────────────────────────────────────────────
export const deliveryApi = {
  list: (params?: { page?: number; size?: number; date?: string }) =>
    apiClient.get<PageResponse<Delivery>>('/api/v1/sales/deliveries', { params }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Delivery>(`/api/v1/sales/deliveries/${id}`).then((r) => r.data),
  create: (data: object) =>
    apiClient.post<Delivery>('/api/v1/sales/deliveries', data).then((r) => r.data),
  recordShop: (deliveryId: string, shopId: string, data: object) =>
    apiClient.post(`/api/v1/sales/deliveries/${deliveryId}/shops/${shopId}`, data).then((r) => r.data),
  complete: (id: string) =>
    apiClient.post(`/api/v1/sales/deliveries/${id}/complete`).then((r) => r.data),
};

// ─── Purchases ────────────────────────────────────────────────────────────────
export const purchaseApi = {
  list: (params?: { invoiceNo?: string; date?: string; page?: number; size?: number }) =>
    apiClient.get<PageResponse<Purchase>>('/api/v1/purchases', { params }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Purchase>(`/api/v1/purchases/${id}`).then((r) => r.data),
  create: (data: object) =>
    apiClient.post<Purchase>('/api/v1/purchases', data).then((r) => r.data),
  update: (id: string, data: object) =>
    apiClient.put<Purchase>(`/api/v1/purchases/${id}`, data).then((r) => r.data),
  confirm: (id: string, warehouseId: number) =>
    apiClient.post<Purchase>(`/api/v1/purchases/${id}/confirm`, null, { params: { warehouseId } }).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/api/v1/purchases/${id}`).then((r) => r.data),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportApi = {
  salesSummary: (params: { startDate: string; endDate: string }) =>
    apiClient.get('/api/v1/reports/sales-summary', { params }).then((r) => r.data),
  shopOutstanding: () =>
    apiClient.get('/api/v1/reports/shop-outstanding').then((r) => r.data),
  stockStatus: () =>
    apiClient.get('/api/v1/reports/stock-status').then((r) => r.data),
  repPerformance: (params: { startDate: string; endDate: string }) =>
    apiClient.get('/api/v1/reports/rep-performance', { params }).then((r) => r.data),
  endOfDaySummary: (date: string) =>
    apiClient.get<EndOfDaySummary>('/api/v1/reports/end-of-day-summary', { params: { date } }).then((r) => r.data),
};

// ─── QR Verification ──────────────────────────────────────────────────────
export const qrApi = {
  getShopQr: (shopId: string) =>
    apiClient.get(`/api/v1/sales/qr/shop/${shopId}`).then((r) => r.data),
  verify: (data: { shopId: number; deliveryId?: number; latitude?: number; longitude?: number; notes?: string }) =>
    apiClient.post('/api/v1/sales/qr/verify', data).then((r) => r.data),
  getDeliveryVisits: (deliveryId: string) =>
    apiClient.get(`/api/v1/sales/qr/delivery/${deliveryId}/visits`).then((r) => r.data),
};
