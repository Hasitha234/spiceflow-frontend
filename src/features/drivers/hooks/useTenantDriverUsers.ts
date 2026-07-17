import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

export interface DriverUserResponse {
  id: number;
  name: string;
  email: string;
  userType: string;
}

export function useTenantDriverUsers() {
  return useQuery({
    queryKey: ['tenantDriverUsers'],
    queryFn: async () => {
      const response = await apiClient.get<DriverUserResponse[]>('/api/v1/auth/tenant/users/drivers');
      return response.data;
    },
  });
}
