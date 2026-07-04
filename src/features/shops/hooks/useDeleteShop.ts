import { useDeleteShop as useOrvalDeleteShop } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { shopKeys } from '../queryKeys/shopKeys';
import { getErrorMessage } from '@/utils/getProblemDetails';

/**
 * Wraps Orval's generated useDeleteShop with:
 * - Automatic cache invalidation of the shop list on success.
 * - Toast notifications for success/error.
 */
export function useDeleteShop(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useOrvalDeleteShop({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: shopKeys.all() });
        message.success('Shop deleted successfully');
        options?.onSuccess?.();
      },
      onError: (error) => {
        message.error(getErrorMessage(error));
      },
    },
  });
}
