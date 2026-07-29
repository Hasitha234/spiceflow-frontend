import apiClient from '@/api/client';
import type { MorningSummary, MorningSummaryRequest } from '../types';

export const getMorningSummaries = async (page = 0, size = 10) => {
  const response = await apiClient.get<{
    content: MorningSummary[];
    totalElements: number;
    totalPages: number;
    number: number;
  }>(`/api/v1/morning-summaries?page=${page}&size=${size}`);
  return response.data;
};

export const createMorningSummary = async (data: MorningSummaryRequest) => {
  const response = await apiClient.post<MorningSummary>('/api/v1/morning-summaries', data);
  return response.data;
};

export const getMorningSummaryById = async (id: number) => {
  const response = await apiClient.get<MorningSummary>(`/api/v1/morning-summaries/${id}`);
  return response.data;
};
