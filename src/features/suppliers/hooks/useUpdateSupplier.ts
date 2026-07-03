import { useUpdateSupplier as useOrvalUpdateSupplier } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { supplierKeys } from '../queryKeys/supplierKeys';
import { getErrorMessage } from '@/utils/getProblemDetails';

/**
 * Wraps Orval's generated useUpdateSupplier with:
 * - Automatic cache invalidation of both the supplier list and detail.
 * - Toast notifications for success/error.
 */
export function useUpdateSupplier(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useOrvalUpdateSupplier({
    mutation: {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({ queryKey: supplierKeys.all() });
        queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.id) });
        message.success('Supplier updated successfully');
        options?.onSuccess?.();
      },
      onError: (error) => {
        message.error(getErrorMessage(error));
      },
    },
  });
}
