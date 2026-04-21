import type { ReactNode } from 'react';
import type { DatabricksUser } from '@/lib/databricksUser';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell({
  user,
  children,
}: {
  user: DatabricksUser;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-bg-page">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
