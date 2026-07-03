import { useCreateProduct as useOrvalCreateProduct } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { productKeys } from '../queryKeys/productKeys';
import { getErrorMessage } from '@/utils/getProblemDetails';

/**
 * Wraps Orval's generated useCreateProduct with:
 * - Automatic cache invalidation of the product list on success.
 * - Toast notifications for success/error.
 */
export function useCreateProduct(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useOrvalCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: productKeys.all() });
        message.success('Product created successfully');
        options?.onSuccess?.();
      },
      onError: (error) => {
        message.error(getErrorMessage(error));
      },
    },
  });
}
