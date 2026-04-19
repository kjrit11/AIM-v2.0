import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { SessionProviderWrapper } from '@/components/layout/SessionProviderWrapper';

/**
 * (app) route-group layout — AIM v2
 * ====================================
 *
 * Wraps every protected route (anything under /src/app/(app)/*) in:
 *   1. SessionProviderWrapper — provides useSession() to client components
 *   2. AppShell — sidebar + top bar chrome
 *
 * DOES NOT re-declare <html> or <body> — the root layout at
 * src/app/layout.tsx owns those, and redeclaring here would break
 * next/font/google and produce duplicate document elements.
 *
 * Middleware already gates access to these routes, so an unauthenticated
 * user never sees this layout render. Server component.
 */

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProviderWrapper>
      <AppShell>{children}</AppShell>
    </SessionProviderWrapper>
  );
}
