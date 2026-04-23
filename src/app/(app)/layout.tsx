import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { AppShell } from '@/components/layout/AppShell';
import { requireDatabricksUser } from '@/lib/databricksUser';
import { withRequestContext } from '@/lib/requestContext';
import { getOrProvisionUser } from '@/lib/users';

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
    async () => {
      // Reconcile the header-authenticated user against sales.core.users.
      // Lets any errors propagate to the Next.js error boundary rather than
      // silently showing a blank dashboard.
      const userRecord = await getOrProvisionUser(user.email, user.username);
      return (
        <AppShell user={user} userRecord={userRecord}>
          {children}
        </AppShell>
      );
    },
  );
}
