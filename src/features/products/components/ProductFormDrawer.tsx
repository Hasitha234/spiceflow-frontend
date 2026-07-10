import React, { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EntityFormDrawer } from '@/components/common';
import { ProductForm } from './ProductForm';
import { productSchema, defaultProductValues } from '../schemas/productSchema';
import type { ProductFormValues } from '../schemas/productSchema';
import type { ProductResponse } from '@/api/generated';
import { useProductLookups } from '../hooks/useProductLookups';
import { useCreateProduct } from '../hooks/useCreateProduct';
import { useUpdateProduct } from '../hooks/useUpdateProduct';

export interface ProductFormDrawerProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the drawer switches to "Edit" mode. */
  editingProduct?: ProductResponse | null;
  /** When provided, locks and pre-selects the supplier. */
  defaultSupplierId?: number;
}

/**
 * Drawer shell that wraps ProductForm with create/edit logic.
 * ProductForm itself is reusable in other contexts (e.g. full-page wizards).
 */
export const ProductFormDrawer: React.FC<ProductFormDrawerProps> = ({
  open,
  onClose,
  editingProduct,
  defaultSupplierId,
}) => {
  const isEditing = !!editingProduct;
  const { supplierOptions, isLoading: lookupsLoading } = useProductLookups();

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultProductValues,
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (editingProduct) {
      methods.reset({
        sku: editingProduct.sku ?? '',
        name: editingProduct.name ?? '',
        description: editingProduct.description ?? '',
        basePrice: editingProduct.basePrice ?? 0,
        unitOfMeasure: editingProduct.unitOfMeasure ?? 'kg',
        categoryId: editingProduct.categoryId ?? 0,
        supplierId: editingProduct.supplierId ?? 0,
        netWeight: editingProduct.netWeight ?? '',
        unitType: editingProduct.unitType ?? 'BOX',
        boxConfiguration: editingProduct.boxConfiguration ?? '',
        itemsPerSoldUnit: editingProduct.itemsPerSoldUnit ?? 0,
        soldUnitsPerBox: editingProduct.soldUnitsPerBox ?? 0,
        ratePerSoldUnit: editingProduct.ratePerSoldUnit ?? 0,
      });
    } else {
      methods.reset({
        ...defaultProductValues,
        supplierId: defaultSupplierId ?? 0,
      });
    }
  }, [editingProduct, defaultSupplierId, methods]);

  const createMutation = useCreateProduct({ onSuccess: onClose });
  const updateMutation = useUpdateProduct({ onSuccess: onClose });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = methods.handleSubmit((values) => {
    if (isEditing && editingProduct?.id) {
      updateMutation.mutate({ id: editingProduct.id, data: values });
    } else {
      createMutation.mutate({ data: values });
    }
  });

  return (
    <EntityFormDrawer
      open={open}
      title={isEditing ? 'Edit Product' : 'Create Product'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText={isEditing ? 'Save Changes' : 'Create Product'}
      loading={isSaving}
    >
      <FormProvider {...methods}>
        <ProductForm
          supplierOptions={supplierOptions}
          lookupsLoading={lookupsLoading}
          disabledSupplier={!!defaultSupplierId && !isEditing}
        />
      </FormProvider>
    </EntityFormDrawer>
  );
};
