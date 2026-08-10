import { z } from 'zod';

export const morningSummaryItemSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  expectedReturnAmount: z.number().min(0, 'Return amount cannot be negative').optional(),
  expectedReturnPrice: z.number().min(0, 'Return price cannot be negative').optional(),
});

export const morningSummarySchema = z.object({
  repId: z.number().min(1, 'Rep is required'),
  driverId: z.number().min(1, 'Driver is required'),
  summaryDate: z.string().min(1, 'Date is required'),
  items: z.array(morningSummaryItemSchema)
    .min(1, 'At least one item is required')
    .refine(
      (items) => {
        const validProductIds = items.map(i => i.productId).filter(id => id > 0);
        return new Set(validProductIds).size === validProductIds.length;
      },
      { message: 'Duplicate products are not allowed. Merge quantities into a single line.' }
    ),
});

export type MorningSummaryFormData = z.infer<typeof morningSummarySchema>;
