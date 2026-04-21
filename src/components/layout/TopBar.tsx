import { cn } from '@/lib/cn';
import type { DatabricksUser } from '@/lib/databricksUser';
import { UserMenu } from './UserMenu';

export function TopBar({ user }: { user: DatabricksUser }) {
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
