import React, { useEffect, useState } from 'react';
import { Form } from 'antd';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EntityFormDrawer } from '@/components/common';
import { ShopForm } from './ShopForm';
import { shopSchema, defaultShopValues } from '../schemas/shopSchema';
import type { ShopFormValues } from '../schemas/shopSchema';
import type { ShopResponse } from '@/api/generated';
import { useCreateShop } from '../hooks/useCreateShop';
import { useUpdateShop } from '../hooks/useUpdateShop';
import { ShopQrModal } from './ShopQrModal';
import { qrApi } from '@/api/sales';
import { message } from 'antd';

export interface ShopFormDrawerProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the drawer switches to "Edit" mode. */
  editingShop?: ShopResponse | null;
}

/**
 * Drawer shell that wraps ShopForm with create/edit logic.
 */
export const ShopFormDrawer: React.FC<ShopFormDrawerProps> = ({
  open,
  onClose,
  editingShop,
}) => {
  const isEditing = !!editingShop;
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [newlyCreatedShop, setNewlyCreatedShop] = useState<ShopResponse | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);

  const methods = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: defaultShopValues,
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (editingShop) {
      methods.reset({
        name: editingShop.name ?? '',
        ownerName: editingShop.ownerName ?? '',
        phone: editingShop.phone ?? '',
        address: editingShop.address ?? '',
        area: editingShop.area ?? '',
        route: editingShop.route ?? '',
        assignedRepId: editingShop.assignedRepId ?? null,
        outstandingLoan: editingShop.outstandingLoan ?? 0,
        latitude: editingShop.latitude ?? null,
        longitude: editingShop.longitude ?? null,
        isActive: editingShop.isActive ?? true,
      });
    } else {
      methods.reset(defaultShopValues);
    }
  }, [editingShop, methods]);

  const createMutation = useCreateShop({ 
    onSuccess: async (createdShop: ShopResponse) => {
      onClose(); // Close the drawer
      try {
        if (createdShop.id) {
          const res = await qrApi.getShopQr(createdShop.id);
          setQrPayload(res.qrPayload);
          setNewlyCreatedShop(createdShop);
          setQrModalOpen(true);
        }
      } catch (err) {
        message.error('Failed to load QR code for the new shop');
      }
    } 
  });
  const updateMutation = useUpdateShop({ onSuccess: onClose });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = methods.handleSubmit((values: ShopFormValues) => {
    const payload = {
      ...values,
      assignedRepId: values.assignedRepId ?? undefined,
      latitude: values.latitude ?? undefined,
      longitude: values.longitude ?? undefined,
    };
    if (isEditing && editingShop?.id) {
      updateMutation.mutate({ id: editingShop.id, data: payload as never });
    } else {
      createMutation.mutate({ data: payload as never });
    }
  });

  return (
    <>
      <EntityFormDrawer
        open={open}
        title={isEditing ? 'Edit Shop' : 'Register New Shop'}
        onClose={onClose}
        onSubmit={handleSubmit}
        submitText={isEditing ? 'Save Changes' : 'Register Shop'}
        loading={isSaving}
      >
        <Form layout="vertical" colon={false} component={false}>
          <FormProvider {...methods}>
            <ShopForm isEditing={isEditing} />
          </FormProvider>
        </Form>
      </EntityFormDrawer>

      <ShopQrModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        shop={newlyCreatedShop}
        qrPayload={qrPayload}
      />
    </>
  );
};
