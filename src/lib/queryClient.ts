import { QueryClient } from '@tanstack/react-query';

/**
 * Create a new QueryClient with conservative defaults. Per-query options
 * (staleTime from CACHE.USERS etc.) are set at the call site, not here.
 * Keeping global defaults conservative prevents surprising other queries.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
