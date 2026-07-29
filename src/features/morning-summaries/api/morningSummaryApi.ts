import { api } from '@/lib/api';
import { MorningSummary, MorningSummaryRequest } from '../types';

export const getMorningSummaries = async (page = 0, size = 10) => {
  const response = await api.get<{
    content: MorningSummary[];
    totalElements: number;
    totalPages: number;
    number: number;
  }>(`/api/v1/morning-summaries?page=${page}&size=${size}`);
  return response.data;
};

export const createMorningSummary = async (data: MorningSummaryRequest) => {
  const response = await api.post<MorningSummary>('/api/v1/morning-summaries', data);
  return response.data;
};

export const getMorningSummaryById = async (id: number) => {
  const response = await api.get<MorningSummary>(`/api/v1/morning-summaries/${id}`);
  return response.data;
};
