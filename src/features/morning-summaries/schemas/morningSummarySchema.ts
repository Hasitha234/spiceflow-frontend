import { z } from 'zod';

export const morningSummarySchema = z.object({
  repId: z.number().min(1, 'Rep is required'),
  driverId: z.number().min(1, 'Driver is required'),
  summaryDate: z.string().min(1, 'Date is required'),
  finalEstimateValue: z.number().min(0.01, 'Estimate value must be greater than 0'),
});

export type MorningSummaryFormData = z.infer<typeof morningSummarySchema>;
