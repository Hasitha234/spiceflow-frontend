import { z } from 'zod';

/**
 * Zod schema mirroring the backend @Valid constraints on RepRequest.
 * Used by React Hook Form + zodResolver in RepFormDrawer.
 */
export const repSchema = z.object({
  name: z.string().min(1, 'Rep name is required'),
  employeeId: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  area: z.string().optional(),
  employmentDate: z.string().optional(),
  terminationDate: z.string().optional(),
  isActive: z.boolean(),
});

export type RepFormValues = z.infer<typeof repSchema>;

/** Default form values for creating a new rep. */
export const defaultRepValues: RepFormValues = {
  name: '',
  employeeId: '',
  email: '',
  phone: '',
  area: '',
  employmentDate: '',
  terminationDate: '',
  isActive: true,
};
