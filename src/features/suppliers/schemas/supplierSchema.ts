import { z } from 'zod';

/**
 * Zod schema mirroring the backend @Valid constraints on SupplierRequest.
 * Used by React Hook Form + zodResolver in SupplierForm.
 */
export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contactEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  contactPhone: z.string().max(50, 'Phone number must be under 50 characters').optional(),
  address: z.string().optional(),
  taxId: z.string().max(100, 'Tax ID must be under 100 characters').optional(),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

/** Default form values for creating a new supplier. */
export const defaultSupplierValues: SupplierFormValues = {
  name: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  taxId: '',
};
