import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FilterPanel } from '@/components/common/FilterPanel';
import { RepForm } from '../components/RepForm';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { useAuthStore } from '@/store/authStore';
import { repSchema, defaultRepValues } from '../schemas/repSchema';
import { repMetadata } from '../metadata';

// Helper wrapper for react-hook-form
const FormWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const methods = useForm({ defaultValues: defaultRepValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('Sales Representatives Module Tests', () => {
  it('validates repSchema correctly according to business rules', () => {
    const validData = {
      name: 'Kasun Silva',
      employeeId: 'REP-001',
      email: 'kasun@spiceflow.com',
      phone: '0712345678',
      area: 'Western',
      isActive: true,
    };
    const result = repSchema.safeParse(validData);
    expect(result.success).toBe(true);

    const invalidData = {
      name: '', // Empty name required failure
      email: 'invalid-email',
      isActive: true,
    };
    const failedResult = repSchema.safeParse(invalidData);
    expect(failedResult.success).toBe(false);
  });

  it('exposes correct metadata properties for central routing and menu ordering', () => {
    expect(repMetadata.id).toBe('reps');
    expect(repMetadata.path).toBe('settings/reps');
    expect(repMetadata.order).toBe(40);
    expect(repMetadata.permissions).toContain('MASTER_DATA_VIEW');
  });

  it('renders FilterPanel with search input and triggers callbacks', () => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    render(
      <FilterPanel
        filters={[{ type: 'search', key: 'q', placeholder: 'Search sales reps...' }]}
        values={{ q: 'Kasun' }}
        onChange={onChange}
        onReset={onReset}
      />
    );

    expect(screen.getByDisplayValue('Kasun')).toBeDefined();
    const resetBtn = screen.getByText('Reset');
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('renders RepForm fields correctly inside FormProvider', () => {
    render(
      <FormWrapper>
        <RepForm />
      </FormWrapper>
    );

    expect(screen.getByLabelText(/Representative Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Employee ID/i)).toBeDefined();
    expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/Phone Number/i)).toBeDefined();
    expect(screen.getByLabelText(/Assigned Area/i)).toBeDefined();
  });

  it('renders children inside PermissionGuard only if user has required role for Reps', () => {
    useAuthStore.setState({
      user: {
        email: 'salesmgr@spiceflow.com',
        roles: ['ROLE_SALES_MANAGER'],
        permissions: [],
      },
      accessToken: 'mock-jwt',
      isAuthenticated: true,
    });

    render(
      <PermissionGuard requireRole="ROLE_SALES_MANAGER">
        <button>Register Sales Rep</button>
      </PermissionGuard>
    );

    expect(screen.getByText('Register Sales Rep')).toBeDefined();
  });

  it('hides children inside PermissionGuard if role is missing', () => {
    useAuthStore.setState({
      user: {
        email: 'viewer@spiceflow.com',
        roles: ['ROLE_USER'],
        permissions: [],
      },
      accessToken: 'mock-jwt',
      isAuthenticated: true,
    });

    render(
      <PermissionGuard requireRole="ROLE_SALES_MANAGER">
        <button>Register Sales Rep</button>
      </PermissionGuard>
    );

    expect(screen.queryByText('Register Sales Rep')).toBeNull();
  });
});
