import { z } from 'zod';

/**
 * Zod schema mirroring the backend @Valid constraints on ShopRequest.
 * Used by React Hook Form + zodResolver in ShopForm.
 */
export const shopSchema = z.object({
  name: z.string().min(1, 'Shop name is required'),
  ownerName: z.string().optional(),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  area: z.string().min(1, 'Area is required'),
  route: z.string().min(1, 'Route is required'),
  assignedRepId: z.number().optional().nullable(),
  outstandingLoan: z.number().min(0, 'Outstanding loan cannot be negative').optional(),
  latitude: z.number().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90').optional().nullable(),
  longitude: z.number().min(-180, 'Longitude must be >= -180').max(180, 'Longitude must be <= 180').optional().nullable(),
  isActive: z.boolean(),
});

export type ShopFormValues = z.infer<typeof shopSchema>;

/** Default form values for creating a new shop. */
export const defaultShopValues: ShopFormValues = {
  name: '',
  ownerName: '',
  phone: '',
  address: '',
  area: '',
  route: '',
  assignedRepId: null,
  outstandingLoan: 0,
  latitude: null,
  longitude: null,
  isActive: true,
};
