import { useDeleteDriver as useOrvalDeleteDriver } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { driverKeys } from '../queryKeys/driverKeys';
import { getErrorMessage } from '@/utils/getProblemDetails';

/**
 * Wraps Orval's generated useDeleteDriver with:
 * - Automatic cache invalidation of the driver list on success.
 * - Toast notifications for success/error.
 */
export function useDeleteDriver(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useOrvalDeleteDriver({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: driverKeys.all() });
        message.success('Driver deleted successfully');
        options?.onSuccess?.();
      },
      onError: (error) => {
        message.error(getErrorMessage(error));
      },
    },
  });
}
