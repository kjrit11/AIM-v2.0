'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { createQueryClient } from '@/lib/queryClient';

/**
 * Wraps the app in a React Query context. QueryClient must be created via
 * useState(() => ...) so each mount gets a stable client and we don't leak
 * state across server requests.
 *
 * See docs/GOTCHAS.md § "React Query + Next.js 14 App Router".
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
