import { cn } from '@/lib/cn';
import type { DatabricksUser } from '@/lib/databricksUser';
import type { UserRecord } from '@/lib/users';
import { UserMenu } from './UserMenu';

export function TopBar({
  user,
}: {
  user: DatabricksUser;
  // Accepted for future role-aware UI (Phase 3c). Currently unused — the
  // header-authenticated `user` covers everything the TopBar renders today.
  userRecord: UserRecord;
}) {
  return (
    <header
      className={cn(
        'flex h-14 items-center justify-end',
        'border-b border-border-subtle bg-bg-sidebar',
        'px-6',
      )}
    >
      <UserMenu user={user} />
    </header>
  );
}
