import { useCreateShop as useOrvalCreateShop } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { shopKeys } from '../queryKeys/shopKeys';
import { getErrorMessage } from '@/utils/getProblemDetails';

/**
 * Wraps Orval's generated useCreateShop with:
 * - Automatic cache invalidation of the shop list on success.
 * - Toast notifications for success/error.
 */
export function useCreateShop(options?: { onSuccess?: (data: any) => void }) {
  const queryClient = useQueryClient();

  return useOrvalCreateShop({
    mutation: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: shopKeys.all() });
        message.success('Shop created successfully');
        options?.onSuccess?.(res);
      },
      onError: (error) => {
        message.error(getErrorMessage(error));
      },
    },
  });
}
