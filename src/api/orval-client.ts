import Axios, { type AxiosRequestConfig } from 'axios';
import apiClient from './client';

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = apiClient({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-expect-error Orval generated custom mutator attach cancel function
  promise.cancel = () => {
    source.cancel('Query was cancelled by React Query');
  };

  return promise;
};
