import type { AxiosError } from 'axios';

/**
 * RFC 7807 Problem Details structure.
 * Standardized error contract returned by the SpiceFlow backend.
 */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  timestamp?: string;
  traceId?: string;
  errors?: FieldError[];
}

export interface FieldError {
  field: string;
  rejectedValue?: unknown;
  message: string;
}

/**
 * Extracts a ProblemDetails object from an Axios error response.
 * Falls back to sensible defaults if the response is not RFC 7807 compliant.
 */
export function getProblemDetails(error: unknown): ProblemDetails {
  const axiosError = error as AxiosError<ProblemDetails>;

  if (axiosError?.response?.data && typeof axiosError.response.data === 'object') {
    const data = axiosError.response.data;
    return {
      type: data.type,
      title: data.title ?? 'An error occurred',
      status: data.status ?? axiosError.response.status,
      detail: data.detail ?? axiosError.message,
      instance: data.instance,
      timestamp: data.timestamp,
      traceId: data.traceId,
      errors: data.errors,
    };
  }

  return {
    title: 'Network Error',
    status: axiosError?.response?.status ?? 0,
    detail: axiosError?.message ?? 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Returns a user-facing error message from a ProblemDetails object.
 */
export function getErrorMessage(error: unknown): string {
  const problem = getProblemDetails(error);
  return problem.detail ?? problem.title ?? 'An unexpected error occurred';
}

/**
 * Returns the traceId from a ProblemDetails error, if present.
 */
export function getTraceId(error: unknown): string | undefined {
  return getProblemDetails(error).traceId;
}

/**
 * Maps RFC 7807 field errors into a Record suitable for
 * React Hook Form's `setError` function.
 */
export function mapFieldErrors(error: unknown): Record<string, string> {
  const problem = getProblemDetails(error);
  const mapped: Record<string, string> = {};
  if (problem.errors) {
    for (const fe of problem.errors) {
      mapped[fe.field] = fe.message;
    }
  }
  return mapped;
}
