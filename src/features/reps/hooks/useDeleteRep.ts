import { useDeleteRep as useOrvalDeleteRep } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { repKeys } from '../queryKeys/repKeys';
import { getErrorMessage } from '@/utils/getProblemDetails';

/**
 * Wraps Orval's generated useDeleteRep with:
 * - Automatic cache invalidation of the rep list on success.
 * - Toast notifications for success/error.
 */
export function useDeleteRep(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useOrvalDeleteRep({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: repKeys.all() });
        message.success('Sales representative deleted successfully');
        options?.onSuccess?.();
      },
      onError: (error) => {
        message.error(getErrorMessage(error));
      },
    },
  });
}
