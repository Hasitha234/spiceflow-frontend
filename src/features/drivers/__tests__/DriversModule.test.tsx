import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FilterPanel } from '@/components/common/FilterPanel';
import { DriverForm } from '../components/DriverForm';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { useAuthStore } from '@/store/authStore';
import { driverSchema, defaultDriverValues } from '../schemas/driverSchema';
import { driverMetadata } from '../metadata';
import { DriverRequestStatus } from '@/api/generated';

// Helper wrapper for react-hook-form
const FormWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const methods = useForm({ defaultValues: defaultDriverValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('Drivers & Logistics Module Tests', () => {
  it('validates driverSchema correctly according to business rules', () => {
    const validData = {
      name: 'Nimal Perera',
      employeeId: 'DRV-001',
      email: 'nimal@spiceflow.com',
      phone: '0773456789',
      assignedVehicle: 'WP LC-1234',
      status: DriverRequestStatus.AVAILABLE,
      isActive: true,
    };
    const result = driverSchema.safeParse(validData);
    expect(result.success).toBe(true);

    const invalidData = {
      name: '', // Empty name required failure
      email: 'invalid-email',
      status: DriverRequestStatus.AVAILABLE,
      isActive: true,
    };
    const failedResult = driverSchema.safeParse(invalidData);
    expect(failedResult.success).toBe(false);
  });

  it('exposes correct metadata properties for central routing and menu ordering', () => {
    expect(driverMetadata.id).toBe('drivers');
    expect(driverMetadata.path).toBe('settings/drivers');
    expect(driverMetadata.order).toBe(50);
    expect(driverMetadata.permissions).toContain('MASTER_DATA_VIEW');
  });

  it('renders FilterPanel with search input and triggers callbacks', () => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    render(
      <FilterPanel
        filters={[{ type: 'search', key: 'q', placeholder: 'Search drivers...' }]}
        values={{ q: 'Nimal' }}
        onChange={onChange}
        onReset={onReset}
      />
    );

    expect(screen.getByDisplayValue('Nimal')).toBeDefined();
    const resetBtn = screen.getByText('Reset');
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('renders DriverForm fields correctly inside FormProvider', () => {
    render(
      <FormWrapper>
        <DriverForm warehouseOptions={[{ label: 'Main Warehouse', value: 1 }]} />
      </FormWrapper>
    );

    expect(screen.getByLabelText(/Driver Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Employee ID/i)).toBeDefined();
    expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/Phone Number/i)).toBeDefined();
    expect(screen.getByLabelText(/Assigned Vehicle/i)).toBeDefined();
    expect(screen.getByLabelText(/License Number/i)).toBeDefined();
    expect(screen.getByLabelText(/Default Warehouse/i)).toBeDefined();
  });

  it('renders children inside PermissionGuard only if user has required role for Drivers', () => {
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
        <button>Register Driver</button>
      </PermissionGuard>
    );

    expect(screen.getByText('Register Driver')).toBeDefined();
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
        <button>Register Driver</button>
      </PermissionGuard>
    );

    expect(screen.queryByText('Register Driver')).toBeNull();
  });
});
