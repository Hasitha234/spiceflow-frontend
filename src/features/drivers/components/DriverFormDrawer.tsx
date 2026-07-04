import React, { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EntityFormDrawer } from '@/components/common';
import { DriverForm } from './DriverForm';
import { driverSchema, defaultDriverValues } from '../schemas/driverSchema';
import type { DriverFormValues } from '../schemas/driverSchema';
import type { DriverResponse } from '@/api/generated';
import { DriverRequestStatus } from '@/api/generated';
import { useDriverLookups } from '../hooks/useDriverLookups';
import { useCreateDriver } from '../hooks/useCreateDriver';
import { useUpdateDriver } from '../hooks/useUpdateDriver';

export interface DriverFormDrawerProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the drawer switches to "Edit" mode. */
  editingDriver?: DriverResponse | null;
}

/**
 * Drawer shell that wraps DriverForm with create/edit logic.
 */
export const DriverFormDrawer: React.FC<DriverFormDrawerProps> = ({
  open,
  onClose,
  editingDriver,
}) => {
  const isEditing = !!editingDriver;
  const { warehouseOptions, isLoading: lookupsLoading } = useDriverLookups();

  const methods = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: defaultDriverValues,
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (editingDriver) {
      methods.reset({
        name: editingDriver.name ?? '',
        employeeId: editingDriver.employeeId ?? '',
        email: editingDriver.email ?? '',
        phone: editingDriver.phone ?? '',
        employmentDate: editingDriver.employmentDate ? editingDriver.employmentDate.substring(0, 10) : '',
        terminationDate: editingDriver.terminationDate ? editingDriver.terminationDate.substring(0, 10) : '',
        licenseNumber: editingDriver.licenseNumber ?? '',
        licenseClass: editingDriver.licenseClass ?? undefined,
        licenseExpiry: editingDriver.licenseExpiry ? editingDriver.licenseExpiry.substring(0, 10) : '',
        defaultWarehouseId: editingDriver.defaultWarehouseId ?? undefined,
        assignedVehicle: editingDriver.assignedVehicle ?? '',
        status: editingDriver.status ?? DriverRequestStatus.AVAILABLE,
        isActive: editingDriver.isActive ?? true,
      });
    } else {
      methods.reset(defaultDriverValues);
    }
  }, [editingDriver, methods]);

  const createMutation = useCreateDriver({ onSuccess: onClose });
  const updateMutation = useUpdateDriver({ onSuccess: onClose });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = methods.handleSubmit((values: DriverFormValues) => {
    const payload = {
      ...values,
      employeeId: values.employeeId || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      employmentDate: values.employmentDate || undefined,
      terminationDate: values.terminationDate || undefined,
      licenseNumber: values.licenseNumber || undefined,
      licenseClass: values.licenseClass || undefined,
      licenseExpiry: values.licenseExpiry || undefined,
      defaultWarehouseId: values.defaultWarehouseId || undefined,
      assignedVehicle: values.assignedVehicle || undefined,
    };
    if (isEditing && editingDriver?.id) {
      updateMutation.mutate({ id: editingDriver.id, data: payload as never });
    } else {
      createMutation.mutate({ data: payload as never });
    }
  });

  return (
    <EntityFormDrawer
      open={open}
      title={isEditing ? 'Edit Delivery Driver' : 'Register New Driver'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText={isEditing ? 'Save Changes' : 'Register Driver'}
      loading={isSaving}
    >
      <FormProvider {...methods}>
        <DriverForm warehouseOptions={warehouseOptions} lookupsLoading={lookupsLoading} />
      </FormProvider>
    </EntityFormDrawer>
  );
};
