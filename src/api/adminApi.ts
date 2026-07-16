import { customInstance } from './orval-client';

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  userType: 'PLATFORM_ADMIN' | 'TENANT_OWNER' | 'DATA_ENTRY' | 'DRIVER';
  tenantId?: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  assignedTenants?: { id: number; businessName: string }[];
  createdAt: string;
}

export interface CreateUserPayload {
  email: string;
  name: string;
  password?: string;
  userType: 'TENANT_OWNER' | 'DATA_ENTRY' | 'DRIVER';
  tenantId?: number;
}

export interface AdminTenant {
  id: number;
  businessName: string;
  contactEmail: string;
  email?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'TRIAL';
  createdAt: string;
  businessTypeId?: number;
  plan?: string;
}

export interface BusinessType {
  id: number;
  name: string;
}

export const adminApi = {
  // Users
  createUser: (data: CreateUserPayload): Promise<AdminUser> => 
    customInstance({ url: '/api/v1/admin/tenants/users', method: 'POST', data }),
  getUsers: (params?: Record<string, unknown>): Promise<{ content: AdminUser[], totalElements: number }> => 
    customInstance({ url: '/api/v1/admin/tenants/users', method: 'GET', params }),
  getUser: (id: number): Promise<AdminUser> => 
    customInstance({ url: `/api/v1/admin/tenants/users/${id}`, method: 'GET' }),
  updateUser: (id: number, data: Partial<CreateUserPayload>): Promise<AdminUser> => 
    customInstance({ url: `/api/v1/admin/tenants/users/${id}`, method: 'PUT', data }),
  deleteUser: (id: number): Promise<void> => 
    customInstance({ url: `/api/v1/admin/tenants/users/${id}`, method: 'DELETE' }),
  assignTenant: (userId: number, tenantId: number): Promise<void> => 
    customInstance({ url: `/api/v1/admin/tenants/users/${userId}/tenants`, method: 'POST', data: { tenantId } }),
  removeTenant: (userId: number, tenantId: number): Promise<void> => 
    customInstance({ url: `/api/v1/admin/tenants/users/${userId}/tenants/${tenantId}`, method: 'DELETE' }),

  // Tenants
  createTenant: (data: Record<string, unknown>): Promise<AdminTenant> => 
    customInstance({ url: '/api/v1/admin/tenants', method: 'POST', data }),
  getTenants: (params?: Record<string, unknown>): Promise<{ content: AdminTenant[], totalElements: number }> => 
    customInstance({ url: '/api/v1/admin/tenants', method: 'GET', params }),
  getTenant: (id: number): Promise<AdminTenant> => 
    customInstance({ url: `/api/v1/admin/tenants/${id}`, method: 'GET' }),
  updateTenant: (id: number, data: Record<string, unknown>): Promise<AdminTenant> => 
    customInstance({ url: `/api/v1/admin/tenants/${id}`, method: 'PUT', data }),
  deleteTenant: (id: number): Promise<void> => 
    customInstance({ url: `/api/v1/admin/tenants/${id}`, method: 'DELETE' }),
  updateTenantStatus: (id: number, data: { status: 'ACTIVE' | 'SUSPENDED' }): Promise<AdminTenant> => 
    customInstance({ url: `/api/v1/admin/tenants/${id}/status`, method: 'PATCH', data }),

  // Business Types
  getBusinessTypes: (): Promise<BusinessType[]> =>
    customInstance({ url: '/api/v1/admin/business-types', method: 'GET' }),
};
