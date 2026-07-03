import { useUpdateProduct as useOrvalUpdateProduct } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { productKeys } from '../queryKeys/productKeys';
import { getErrorMessage } from '@/utils/getProblemDetails';

/**
 * Wraps Orval's generated useUpdateProduct with:
 * - Automatic cache invalidation of both the product list and the edited product detail.
 * - Toast notifications for success/error.
 */
export function useUpdateProduct(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useOrvalUpdateProduct({
    mutation: {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({ queryKey: productKeys.all() });
        queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
        message.success('Product updated successfully');
        options?.onSuccess?.();
      },
      onError: (error) => {
        message.error(getErrorMessage(error));
      },
    },
  });
}
