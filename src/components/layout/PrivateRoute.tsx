import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';

interface PrivateRouteProps {
  children: ReactNode;
  requireRole?: string;
  requireTenant?: boolean;
}

export function PrivateRoute({ children, requireRole, requireTenant }: PrivateRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const tenantId = useTenantStore((state) => state.tenantId);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireRole && user.userType !== requireRole) {
    return <Navigate to="/" replace />;
  }

  if (requireTenant && !tenantId && user.userType !== 'PLATFORM_ADMIN') {
    if (user.userType === 'TENANT_OWNER') {
      return <Navigate to="/select-agency" replace />;
    } else {
      // Something went wrong, clear auth and force re-login
      useAuthStore.getState().clearAuth();
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}
