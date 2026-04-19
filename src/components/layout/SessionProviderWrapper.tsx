'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

/**
 * Thin client-only wrapper around next-auth/react's SessionProvider.
 * Lets the (app) route-group layout stay a server component while still
 * providing session context to client components below it (UserMenu, etc.).
 */

export function SessionProviderWrapper({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
