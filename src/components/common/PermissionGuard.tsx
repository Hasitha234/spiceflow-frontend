import React from 'react';
import { useAuthStore } from '@/store/authStore';

export interface PermissionGuardProps {
  children: React.ReactNode;
  requirePermission?: string | string[];
  requireRole?: string | string[];
  fallback?: React.ReactNode;
}

/**
 * Maps a user's `userType` (from JWT) to a synthetic ROLE_ string so that
 * guards like `requireRole={['ROLE_DATA_ENTRY']}` work regardless of
 * what the user's assigned role is actually named in the database.
 */
function deriveRolesFromUserType(userType?: string): string[] {
  if (!userType) return [];
  // e.g. "DATA_ENTRY" → "ROLE_DATA_ENTRY", "TENANT_OWNER" → "ROLE_TENANT_OWNER"
  return [`ROLE_${userType}`];
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
    // Combine actual JWT roles with synthetic roles derived from userType
    const allUserRoles = [
      ...(user.roles || []),
      ...deriveRolesFromUserType(user.userType),
    ];
    const hasRole = roles.some((role) => allUserRoles.includes(role));
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
