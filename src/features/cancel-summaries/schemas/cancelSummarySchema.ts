import { z } from 'zod';

export const cancelSummaryItemSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
});

export const cancelSummarySchema = z.object({
  repId: z.number().min(1, 'Rep is required'),
  driverId: z.number().min(1, 'Driver is required'),
  summaryDate: z.string().min(1, 'Date is required'),
  items: z.array(cancelSummaryItemSchema)
    .min(1, 'At least one item is required')
    .refine(
      (items) => {
        const validProductIds = items.map(i => i.productId).filter(id => id > 0);
        return new Set(validProductIds).size === validProductIds.length;
      },
      { message: 'Duplicate products are not allowed. Merge quantities into a single line.' }
    ),
});

export type CancelSummaryFormData = z.infer<typeof cancelSummarySchema>;
