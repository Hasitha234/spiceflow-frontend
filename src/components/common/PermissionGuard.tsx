import React from 'react';
import { useAuthStore } from '@/store/authStore';

export interface PermissionGuardProps {
  children: React.ReactNode;
  requirePermission?: string | string[];
  requireRole?: string | string[];
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requirePermission,
  requireRole,
  fallback = null,
}) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <>{fallback}</>;
  }

  // Super admin overrides all permissions
  if (user.roles?.includes('ROLE_SUPER_ADMIN')) {
    return <>{children}</>;
  }

  if (requireRole) {
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
    const hasRole = roles.some((role) => user.roles?.includes(role));
    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  if (requirePermission) {
    const perms = Array.isArray(requirePermission)
      ? requirePermission
      : [requirePermission];
    const hasPerm = perms.some((p) => user.permissions?.includes(p));
    if (!hasPerm) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};
