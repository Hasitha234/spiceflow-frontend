import { z } from 'zod';

export const eveningSummaryItemSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  estimateValue: z.number().min(0, 'Estimate value cannot be negative'),
});

export const eveningSummarySchema = z.object({
  repId: z.number().min(1, 'Rep is required'),
  driverId: z.number().min(1, 'Driver is required'),
  summaryDate: z.string().min(1, 'Summary date is required'),
  items: z.array(eveningSummaryItemSchema).min(1, 'At least one item is required'),
});

export type EveningSummaryFormValues = z.infer<typeof eveningSummarySchema>;
export type EveningSummaryItemFormValues = z.infer<typeof eveningSummaryItemSchema>;
