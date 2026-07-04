import { useUpdateRep as useOrvalUpdateRep } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { repKeys } from '../queryKeys/repKeys';
import { getErrorMessage } from '@/utils/getProblemDetails';

/**
 * Wraps Orval's generated useUpdateRep with:
 * - Automatic cache invalidation of both the rep list and detail.
 * - Toast notifications for success/error.
 */
export function useUpdateRep(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useOrvalUpdateRep({
    mutation: {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({ queryKey: repKeys.all() });
        queryClient.invalidateQueries({ queryKey: repKeys.detail(variables.id) });
        message.success('Sales representative updated successfully');
        options?.onSuccess?.();
      },
      onError: (error) => {
        message.error(getErrorMessage(error));
      },
    },
  });
}
