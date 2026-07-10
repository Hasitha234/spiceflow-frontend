import { z } from 'zod';

/**
 * Zod schema mirroring the backend @Valid constraints on ProductRequest.
 * Used by React Hook Form + zodResolver in ProductForm.
 */
export const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  basePrice: z.number().min(0, 'Base price must be ≥ 0'),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
  categoryId: z.number().optional(),
  supplierId: z.number().min(1, 'Supplier is required'),
  netWeight: z.string().optional(),
  unitType: z.string().min(1, 'Unit type is required'),
  boxConfiguration: z.string().optional(),
  itemsPerSoldUnit: z.number().int().optional(),
  soldUnitsPerBox: z.number().int().optional(),
  ratePerSoldUnit: z.number().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

/** Default form values for creating a new product. */
export const defaultProductValues: ProductFormValues = {
  sku: '',
  name: '',
  description: '',
  basePrice: 0,
  unitOfMeasure: 'kg',
  categoryId: 0,
  supplierId: 0,
  netWeight: '',
  unitType: 'BOX',
  boxConfiguration: '',
  itemsPerSoldUnit: 0,
  soldUnitsPerBox: 0,
  ratePerSoldUnit: 0,
};
