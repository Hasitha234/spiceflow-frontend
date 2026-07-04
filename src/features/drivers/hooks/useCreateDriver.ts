import { useCreateDriver as useOrvalCreateDriver } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { driverKeys } from '../queryKeys/driverKeys';
import { getErrorMessage } from '@/utils/getProblemDetails';

/**
 * Wraps Orval's generated useCreateDriver with:
 * - Automatic cache invalidation of the driver list on success.
 * - Toast notifications for success/error.
 */
export function useCreateDriver(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useOrvalCreateDriver({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: driverKeys.all() });
        message.success('Driver created successfully');
        options?.onSuccess?.();
      },
      onError: (error) => {
        message.error(getErrorMessage(error));
      },
    },
  });
}
