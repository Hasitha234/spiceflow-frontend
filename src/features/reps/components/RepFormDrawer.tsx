import React, { useEffect } from 'react';
import { Form } from 'antd';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EntityFormDrawer } from '@/components/common';
import { RepForm } from './RepForm';
import { repSchema, defaultRepValues } from '../schemas/repSchema';
import type { RepFormValues } from '../schemas/repSchema';
import type { RepResponse } from '@/api/generated';
import { useCreateRep } from '../hooks/useCreateRep';
import { useUpdateRep } from '../hooks/useUpdateRep';

export interface RepFormDrawerProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the drawer switches to "Edit" mode. */
  editingRep?: RepResponse | null;
}

/**
 * Drawer shell that wraps RepForm with create/edit logic.
 */
export const RepFormDrawer: React.FC<RepFormDrawerProps> = ({
  open,
  onClose,
  editingRep,
}) => {
  const isEditing = !!editingRep;

  const methods = useForm<RepFormValues>({
    resolver: zodResolver(repSchema),
    defaultValues: defaultRepValues,
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (editingRep) {
      methods.reset({
        name: editingRep.name ?? '',
        employeeId: editingRep.employeeId ?? '',
        email: editingRep.email ?? '',
        phone: editingRep.phone ?? '',
        area: editingRep.area ?? '',
        employmentDate: editingRep.employmentDate ? editingRep.employmentDate.substring(0, 10) : '',
        terminationDate: editingRep.terminationDate ? editingRep.terminationDate.substring(0, 10) : '',
        isActive: editingRep.isActive ?? true,
      });
    } else {
      methods.reset(defaultRepValues);
    }
  }, [editingRep, methods]);

  const createMutation = useCreateRep({ onSuccess: onClose });
  const updateMutation = useUpdateRep({ onSuccess: onClose });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = methods.handleSubmit((values: RepFormValues) => {
    const payload = {
      ...values,
      employeeId: values.employeeId || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      area: values.area || undefined,
      employmentDate: values.employmentDate || undefined,
      terminationDate: values.terminationDate || undefined,
    };
    if (isEditing && editingRep?.id) {
      updateMutation.mutate({ id: editingRep.id, data: payload as never });
    } else {
      createMutation.mutate({ data: payload as never });
    }
  });

  return (
    <EntityFormDrawer
      open={open}
      title={isEditing ? 'Edit Sales Representative' : 'Register New Sales Representative'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText={isEditing ? 'Save Changes' : 'Register Sales Rep'}
      loading={isSaving}
    >
      <Form layout="vertical" colon={false} component={false}>
        <FormProvider {...methods}>
          <RepForm />
        </FormProvider>
      </Form>
    </EntityFormDrawer>
  );
};
