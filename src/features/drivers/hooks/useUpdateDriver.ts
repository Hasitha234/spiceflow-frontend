import { useUpdateDriver as useOrvalUpdateDriver } from '@/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { driverKeys } from '../queryKeys/driverKeys';
import { getErrorMessage } from '@/utils/getProblemDetails';

/**
 * Wraps Orval's generated useUpdateDriver with:
 * - Automatic cache invalidation of both the driver list and detail.
 * - Toast notifications for success/error.
 */
export function useUpdateDriver(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useOrvalUpdateDriver({
    mutation: {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({ queryKey: driverKeys.all() });
        queryClient.invalidateQueries({ queryKey: driverKeys.detail(variables.id) });
        message.success('Driver updated successfully');
        options?.onSuccess?.();
      },
      onError: (error) => {
        message.error(getErrorMessage(error));
      },
    },
  });
}
