import { z } from 'zod';
import { DriverRequestStatus, DriverRequestLicenseClass } from '@/api/generated';

/**
 * Zod schema mirroring the backend @Valid constraints on DriverRequest.
 * Used by React Hook Form + zodResolver in DriverFormDrawer.
 */
export const driverSchema = z.object({
  name: z.string().min(1, 'Driver name is required'),
  employeeId: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  employmentDate: z.string().optional(),
  terminationDate: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseClass: z.nativeEnum(DriverRequestLicenseClass).optional(),
  licenseExpiry: z.string().optional(),
  defaultWarehouseId: z.number().optional().nullable(),
  assignedVehicle: z.string().optional(),
  status: z.nativeEnum(DriverRequestStatus),
  isActive: z.boolean(),
});

export type DriverFormValues = z.infer<typeof driverSchema>;

/** Default form values for creating a new driver. */
export const defaultDriverValues: DriverFormValues = {
  name: '',
  employeeId: '',
  email: '',
  phone: '',
  employmentDate: '',
  terminationDate: '',
  licenseNumber: '',
  licenseClass: undefined,
  licenseExpiry: '',
  defaultWarehouseId: undefined,
  assignedVehicle: '',
  status: DriverRequestStatus.AVAILABLE,
  isActive: true,
};
