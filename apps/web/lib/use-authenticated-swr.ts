'use client';

import useSWR, { type SWRConfiguration, type SWRResponse } from 'swr';
import { useAuth } from '@/lib/auth-context';
import { fetcher } from '@/lib/fetcher';

type AuthenticatedSwrKey = string | null;

export function useAuthenticatedSWR<Data = unknown, Error = unknown>(
  path: string | null,
  config?: SWRConfiguration<Data, Error>,
): SWRResponse<Data, Error> & { isPageLoading: boolean; showError: boolean } {
  const { isReady } = useAuth();
  const key: AuthenticatedSwrKey = isReady && path ? path : null;

  const swr = useSWR<Data, Error>(key, fetcher as (url: string) => Promise<Data>, {
    shouldRetryOnError: true,
    errorRetryCount: 3,
    ...config,
  });

  const isPageLoading = !isReady || swr.isLoading || (swr.isValidating && swr.data === undefined);
  const showError = Boolean(swr.error) && swr.data === undefined && !swr.isValidating;

  return { ...swr, isPageLoading, showError };
}
