import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';

/**
 * Axios instance — the single source of truth for all API calls.
 *
 * Security model:
 *  - Access token: stored in Zustand memory, attached via request interceptor.
 *  - Refresh token: HttpOnly cookie, never accessible from JS, sent automatically.
 *  - Tenant ID: read from TenantStore, attached as X-Tenant-ID on every request.
 *
 * 401 Refresh Mutex:
 *  - Multiple concurrent requests that all receive a 401 will share a single
 *    in-flight refresh call. All other failing requests queue up and are
 *    retried once the new access token arrives — preventing race conditions
 *    that would invalidate multiple refresh tokens.
 *
 * IMPORTANT: The proxy in vite.config.ts routes /api requests to
 * http://localhost:8080 in development, which ensures cookies are sent on
 * same-origin requests and avoids CORS preflight issues with credentials.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Required to send HttpOnly cookies cross-origin in prod
  paramsSerializer: {
    serialize: (params) => {
      const searchParams = new URLSearchParams();
      
      const addParam = (key: string, value: any) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)));
        } else {
          searchParams.append(key, String(value));
        }
      };

      for (const [key, value] of Object.entries(params)) {
        if (key === 'pageable' && value && typeof value === 'object') {
          const { page, size, sort } = value as any;
          if (page !== undefined) addParam('page', page);
          if (size !== undefined) addParam('size', size);
          if (sort !== undefined) addParam('sort', sort);
        } else {
          addParam(key, value);
        }
      }
      
      return searchParams.toString();
    }
  }
});

// ---------------------------------------------------------------------------
// Request interceptor: attach Authorization + X-Tenant-ID headers
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  const tenantId = useTenantStore.getState().tenantId;
  if (tenantId !== null) {
    config.headers['X-Tenant-ID'] = String(tenantId);
  }

  return config;
});

// ---------------------------------------------------------------------------
// 401 Refresh Mutex
// ---------------------------------------------------------------------------
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// ---------------------------------------------------------------------------
// Response interceptor: handle 401 with silent refresh
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // Only attempt refresh on 401 and only once per request
    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    // Don't refresh if we're on the login or refresh endpoint itself
    const url = originalRequest?.url ?? '';
    if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the single in-flight refresh resolves
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest!);
      });
    }

    originalRequest!._retry = true;
    isRefreshing = true;

    try {
      // /auth/refresh reads the HttpOnly cookie — no request body needed
      const response = await axios.post<{ accessToken: string }>(
        `${BASE_URL}/api/v1/auth/refresh`,
        null,
        { withCredentials: true },
      );

      const newAccessToken = response.data.accessToken;
      useAuthStore.getState().setAccessToken(newAccessToken);
      processQueue(null, newAccessToken);

      if (originalRequest) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      return apiClient(originalRequest!);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
