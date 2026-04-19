import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/**
 * AppShell — AIM v2 app chrome wrapper
 * ======================================
 *
 * Layout-only component: fixed sidebar on the left, top bar + scrollable
 * content on the right. Consumed by src/app/(app)/layout.tsx for every
 * authenticated route.
 *
 * No session prop — the Sidebar is presentational and UserMenu pulls
 * session state from SessionProvider (higher up the tree).
 *
 * Server component — all interactivity is inside Sidebar/UserMenu.
 */

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-bg-page">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
