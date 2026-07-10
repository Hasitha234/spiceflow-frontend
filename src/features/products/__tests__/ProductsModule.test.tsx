import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FilterPanel } from '@/components/common/FilterPanel';
import { ProductForm } from '../components/ProductForm';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { useAuthStore } from '@/store/authStore';

// Helper wrapper for react-hook-form
const FormWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const methods = useForm({ defaultValues: { sku: '', name: '', basePrice: 0 } });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('Products Module Reference Tests', () => {
  it('renders FilterPanel with provided filter definitions and trigger callback on change', () => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    render(
      <FilterPanel
        filters={[{ type: 'search', key: 'q', placeholder: 'Search products...' }]}
        values={{ q: 'turmeric' }}
        onChange={onChange}
        onReset={onReset}
      />
    );

    expect(screen.getByDisplayValue('turmeric')).toBeDefined();
    const resetBtn = screen.getByText('Reset');
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('renders ProductForm fields correctly inside FormProvider', () => {
    render(
      <FormWrapper>
        <ProductForm
          supplierOptions={[{ label: 'Galle Suppliers', value: 1 }]}
        />
      </FormWrapper>
    );

    expect(screen.getByLabelText(/Product Code/i)).toBeDefined();
    expect(screen.getByLabelText(/Product Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Rate/i)).toBeDefined();
  });

  it('renders children inside PermissionGuard only if user has granted authority', () => {
    useAuthStore.setState({
      user: {
        email: 'admin@spiceflow.com',
        roles: [],
        permissions: ['SETTINGS_PRODUCTS'],
      },
      accessToken: 'mock-jwt',
      isAuthenticated: true,
    });

    render(
      <PermissionGuard requirePermission="SETTINGS_PRODUCTS">
        <button>Restricted Action</button>
      </PermissionGuard>
    );

    expect(screen.getByText('Restricted Action')).toBeDefined();
  });

  it('hides children inside PermissionGuard if authority is missing', () => {
    useAuthStore.setState({
      user: {
        email: 'viewer@spiceflow.com',
        roles: [],
        permissions: ['VIEW_ONLY'],
      },
      accessToken: 'mock-jwt',
      isAuthenticated: true,
    });

    render(
      <PermissionGuard requirePermission="SETTINGS_PRODUCTS">
        <button>Restricted Action</button>
      </PermissionGuard>
    );

    expect(screen.queryByText('Restricted Action')).toBeNull();
  });
});
