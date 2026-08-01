import { z } from 'zod';

export const billSchema = z.object({
  billDate: z.string().min(1, 'Date is required'),
  repId: z.number().min(1, 'Rep is required'),
  driverId: z.number().nullable().optional(),
  shopId: z.number().min(1, 'Shop is required'),
  netTotal: z.number().min(0, 'Must be positive'),
  reverseGrts: z.number().min(0, 'Must be positive'),
  freeItemsValue: z.number().min(0, 'Must be positive'),
  discount: z.number().min(0, 'Must be positive'),
  skuDiscount: z.number().min(0, 'Must be positive'),
  returnAmount: z.number().min(0, 'Must be positive'),
});

export type BillFormData = z.infer<typeof billSchema>;

export const billCollectionSchema = z.object({
  cashCollected: z.number().min(0, 'Must be positive'),
  checkCollected: z.number().min(0, 'Must be positive'),
  loanAmount: z.number().min(0, 'Must be positive'),
  loanDueDate: z.string().nullable().optional(),
}).refine(data => {
  if (data.loanAmount > 0 && !data.loanDueDate) {
    return false;
  }
  return true;
}, {
  message: "Due date is required when loan amount is greater than 0",
  path: ["loanDueDate"],
});

export type BillCollectionFormData = z.infer<typeof billCollectionSchema>;
