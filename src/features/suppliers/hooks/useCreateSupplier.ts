import { useCreateSupplier as useOrvalCreateSupplier } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { supplierKeys } from '../queryKeys/supplierKeys';
import { getErrorMessage } from '@/utils/getProblemDetails';

/**
 * Wraps Orval's generated useCreateSupplier with:
 * - Automatic cache invalidation of the supplier list on success.
 * - Toast notifications for success/error.
 */
export function useCreateSupplier(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useOrvalCreateSupplier({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: supplierKeys.all() });
        message.success('Supplier created successfully');
        options?.onSuccess?.();
      },
      onError: (error) => {
        message.error(getErrorMessage(error));
      },
    },
  });
}
