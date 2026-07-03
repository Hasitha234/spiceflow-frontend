import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FilterPanel } from '@/components/common/FilterPanel';
import { SupplierForm } from '../components/SupplierForm';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { useAuthStore } from '@/store/authStore';

// Helper wrapper for react-hook-form
const FormWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const methods = useForm({ defaultValues: { name: '', contactEmail: '' } });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('Suppliers Module Reference Tests', () => {
  it('renders FilterPanel with provided filter definitions and trigger callback on change', () => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    render(
      <FilterPanel
        filters={[{ type: 'search', key: 'q', placeholder: 'Search suppliers...' }]}
        values={{ q: 'Acme' }}
        onChange={onChange}
        onReset={onReset}
      />
    );

    expect(screen.getByDisplayValue('Acme')).toBeDefined();
    const resetBtn = screen.getByText('Reset');
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('renders SupplierForm fields correctly inside FormProvider', () => {
    render(
      <FormWrapper>
        <SupplierForm />
      </FormWrapper>
    );

    expect(screen.getByLabelText(/Supplier Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Tax ID/i)).toBeDefined();
    expect(screen.getByLabelText(/Contact Email/i)).toBeDefined();
    expect(screen.getByLabelText(/Contact Phone/i)).toBeDefined();
  });

  it('renders children inside PermissionGuard only if user has granted role', () => {
    useAuthStore.setState({
      user: {
        email: 'purchasing@spiceflow.com',
        roles: ['ROLE_PURCHASING_AGENT'],
        permissions: [],
      },
      accessToken: 'mock-jwt',
      isAuthenticated: true,
    });

    render(
      <PermissionGuard requireRole="ROLE_PURCHASING_AGENT">
        <button>Restricted Action</button>
      </PermissionGuard>
    );

    expect(screen.getByText('Restricted Action')).toBeDefined();
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
      <PermissionGuard requireRole="ROLE_PURCHASING_AGENT">
        <button>Restricted Action</button>
      </PermissionGuard>
    );

    expect(screen.queryByText('Restricted Action')).toBeNull();
  });
});
