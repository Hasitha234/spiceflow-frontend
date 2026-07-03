import { create } from 'zustand';
import type { AuthUser, LoginResponse } from '@/types/auth';

/**
 * Auth store — access token lives in memory ONLY, never in localStorage.
 * This prevents XSS access to tokens. The refresh token is an HttpOnly cookie
 * managed by the browser and never accessible from JavaScript.
 *
 * On hard refresh the access token is lost; the Axios interceptor will call
 * /auth/refresh (which reads the HttpOnly cookie) to silently re-hydrate the
 * session without any user action.
 */
interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setCredentials: (response: LoginResponse, user: AuthUser) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setCredentials: (response, user) =>
    set({
      accessToken: response.accessToken,
      user,
      isAuthenticated: true,
    }),

  setAccessToken: (token) =>
    set({ accessToken: token, isAuthenticated: true }),

  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),
}));
