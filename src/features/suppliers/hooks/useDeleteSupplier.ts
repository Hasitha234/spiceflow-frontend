import { useDeleteSupplier as useOrvalDeleteSupplier } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { supplierKeys } from '../queryKeys/supplierKeys';
import { getErrorMessage } from '@/utils/getProblemDetails';

/**
 * Wraps Orval's generated useDeleteSupplier with:
 * - Automatic cache invalidation of the supplier list on success.
 * - Toast notifications for success/error.
 */
export function useDeleteSupplier(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useOrvalDeleteSupplier({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: supplierKeys.all() });
        message.success('Supplier deleted successfully');
        options?.onSuccess?.();
      },
      onError: (error) => {
        message.error(getErrorMessage(error));
      },
    },
  });
}
