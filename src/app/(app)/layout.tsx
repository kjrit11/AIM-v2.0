import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { requireDatabricksUser } from '@/lib/databricksUser';

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  const user = requireDatabricksUser();
  return <AppShell user={user}>{children}</AppShell>;
}
