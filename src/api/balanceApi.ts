import { apiClient } from './client';

export interface DailyBalanceResponse {
  date: string;
  morningSummaryTotal: number;
  cancelSummaryTotal: number;
  netDispatchTotal: number;
  billsTotal: number;
  isBalanced: boolean;
  status: string | null;
}

export const balanceApi = {
  getDailyBalance: (date: string) =>
    apiClient.get<DailyBalanceResponse>('/api/v1/daily-balance', { params: { date } }).then((r) => r.data),
    
  proceedDailyBalance: (date: string) =>
    apiClient.post<DailyBalanceResponse>('/api/v1/daily-balance/proceed', null, { params: { date } }).then((r) => r.data),
    
  undoDailyBalance: (date: string) =>
    apiClient.post<DailyBalanceResponse>('/api/v1/daily-balance/undo', null, { params: { date } }).then((r) => r.data),
};
