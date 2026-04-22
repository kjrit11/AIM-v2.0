import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { AppShell } from '@/components/layout/AppShell';
import { requireDatabricksUser } from '@/lib/databricksUser';
import { withRequestContext } from '@/lib/requestContext';

export default async function AppGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = requireDatabricksUser();
  // Middleware stamps x-request-id on the incoming request headers. In prod
  // that header is always present; the fallback is defensive for local dev
  // and for any future bypass of the middleware matcher.
  const requestId = headers().get('x-request-id') ?? crypto.randomUUID();

  return withRequestContext(
    { requestId, userEmail: user.email },
    async () => <AppShell user={user}>{children}</AppShell>,
  );
}
