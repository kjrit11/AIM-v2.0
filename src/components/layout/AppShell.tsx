import type { ReactNode } from 'react';
import type { DatabricksUser } from '@/lib/databricksUser';
import type { UserRecord } from '@/lib/users';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/**
 * AppShell threads two related user objects to descendants:
 *   - `user`         — header-derived DatabricksUser (email, IdP ids, token)
 *   - `userRecord`   — reconciled row from sales.core.users (role, state)
 *
 * Phase 3b keeps the threading explicit via props (matches the Phase 2b
 * pattern). A React context would be appropriate once a third consumer
 * lands; with two (TopBar, DashboardPage) it's not worth the indirection.
 */
export function AppShell({
  user,
  userRecord,
  children,
}: {
  user: DatabricksUser;
  userRecord: UserRecord;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-bg-page">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar user={user} userRecord={userRecord} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
