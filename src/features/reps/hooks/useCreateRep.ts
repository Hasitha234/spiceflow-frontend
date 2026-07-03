import { useCreateRep as useOrvalCreateRep } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { repKeys } from '../queryKeys/repKeys';
import { getErrorMessage } from '@/utils/getProblemDetails';

/**
 * Wraps Orval's generated useCreateRep with:
 * - Automatic cache invalidation of the rep list on success.
 * - Toast notifications for success/error.
 */
export function useCreateRep(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useOrvalCreateRep({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: repKeys.all() });
        message.success('Sales representative created successfully');
        options?.onSuccess?.();
      },
      onError: (error) => {
        message.error(getErrorMessage(error));
      },
    },
  });
}
