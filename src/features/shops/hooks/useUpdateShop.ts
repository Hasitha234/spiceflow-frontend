import { useUpdateShop as useOrvalUpdateShop } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { shopKeys } from '../queryKeys/shopKeys';
import { getErrorMessage } from '@/utils/getProblemDetails';

/**
 * Wraps Orval's generated useUpdateShop with:
 * - Automatic cache invalidation of both the shop list and detail.
 * - Toast notifications for success/error.
 */
export function useUpdateShop(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useOrvalUpdateShop({
    mutation: {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({ queryKey: shopKeys.all() });
        queryClient.invalidateQueries({ queryKey: shopKeys.detail(variables.id) });
        message.success('Shop updated successfully');
        options?.onSuccess?.();
      },
      onError: (error) => {
        message.error(getErrorMessage(error));
      },
    },
  });
}
