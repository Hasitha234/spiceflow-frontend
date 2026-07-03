import React, { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EntityFormDrawer } from '@/components/common';
import { SupplierForm } from './SupplierForm';
import { supplierSchema, defaultSupplierValues } from '../schemas/supplierSchema';
import type { SupplierFormValues } from '../schemas/supplierSchema';
import type { SupplierResponse } from '@/api/generated';
import { useCreateSupplier } from '../hooks/useCreateSupplier';
import { useUpdateSupplier } from '../hooks/useUpdateSupplier';

export interface SupplierFormDrawerProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the drawer switches to "Edit" mode. */
  editingSupplier?: SupplierResponse | null;
}

/**
 * Drawer shell that wraps SupplierForm with create/edit logic.
 * SupplierForm itself is reusable in other contexts.
 */
export const SupplierFormDrawer: React.FC<SupplierFormDrawerProps> = ({
  open,
  onClose,
  editingSupplier,
}) => {
  const isEditing = !!editingSupplier;

  const methods = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: defaultSupplierValues,
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (editingSupplier) {
      methods.reset({
        name: editingSupplier.name ?? '',
        contactEmail: editingSupplier.contactEmail ?? '',
        contactPhone: editingSupplier.contactPhone ?? '',
        address: editingSupplier.address ?? '',
        taxId: editingSupplier.taxId ?? '',
      });
    } else {
      methods.reset(defaultSupplierValues);
    }
  }, [editingSupplier, methods]);

  const createMutation = useCreateSupplier({ onSuccess: onClose });
  const updateMutation = useUpdateSupplier({ onSuccess: onClose });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = methods.handleSubmit((values) => {
    if (isEditing && editingSupplier?.id) {
      updateMutation.mutate({ id: editingSupplier.id, data: values });
    } else {
      createMutation.mutate({ data: values });
    }
  });

  return (
    <EntityFormDrawer
      open={open}
      title={isEditing ? 'Edit Supplier' : 'Create Supplier'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText={isEditing ? 'Save Changes' : 'Create Supplier'}
      loading={isSaving}
    >
      <FormProvider {...methods}>
        <SupplierForm />
      </FormProvider>
    </EntityFormDrawer>
  );
};
