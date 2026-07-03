export interface LoginRequest {
  email: string;
  password: string;
}

/** The refresh token is delivered via HttpOnly cookie — not present in the JSON response body. */
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  passwordChangeRequired: boolean;
}

/** Decoded JWT claims stored in Zustand memory (not persisted). */
export interface AuthUser {
  email: string;
  roles: string[];
  permissions: string[];
  tenantId?: number;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
}

export interface RoleRequest {
  name: string;
  permissions: string[];
}
