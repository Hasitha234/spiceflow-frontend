import { z } from 'zod';

export const morningSummaryItemSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  expectedReturnAmount: z.number().min(0, 'Return amount cannot be negative').optional(),
  expectedReturnPrice: z.number().min(0, 'Return price cannot be negative').optional(),
});

export const morningSummarySchema = z.object({
  repId: z.number().min(1, 'Rep is required'),
  driverId: z.number().min(1, 'Driver is required'),
  items: z.array(morningSummaryItemSchema).min(1, 'At least one item is required'),
});

export type MorningSummaryFormData = z.infer<typeof morningSummarySchema>;
