import { login, refresh, logout, changePassword } from '@/api/generated';
import type { LoginRequest, ChangePasswordRequest } from '@/api/generated';
import type { LoginResponse } from '@/types/auth';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await login(data);
    return res as unknown as LoginResponse;
  },
  refresh: () => refresh(),
  logout: () => logout(),
  changePassword: (data: ChangePasswordRequest) => changePassword(data),
};
