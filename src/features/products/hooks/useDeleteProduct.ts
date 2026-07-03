import { useDeleteProduct as useOrvalDeleteProduct } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { productKeys } from '../queryKeys/productKeys';
import { getErrorMessage } from '@/utils/getProblemDetails';

/**
 * Wraps Orval's generated useDeleteProduct with:
 * - Automatic cache invalidation of the product list on success.
 * - Toast notifications for success/error.
 */
export function useDeleteProduct(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useOrvalDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: productKeys.all() });
        message.success('Product deleted successfully');
        options?.onSuccess?.();
      },
      onError: (error) => {
        message.error(getErrorMessage(error));
      },
    },
  });
}
