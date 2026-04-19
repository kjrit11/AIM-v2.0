import { cn } from '@/lib/cn';
import { UserMenu } from './UserMenu';

/**
 * TopBar — AIM v2 app shell
 * ===========================
 *
 * Fixed-height (56px) bar at the top of every authenticated page.
 * Left side intentionally empty — no logo, no page title (STYLE_GUIDE
 * §8.1: PageHeader lives inside the content area, not the top bar).
 *
 * Right side: UserMenu. That's it, for Phase 2.
 *
 * Server component — it doesn't need session state itself; UserMenu is
 * the only client piece.
 */

export function TopBar() {
  return (
    <header
      className={cn(
        'flex h-14 items-center justify-end',
        'border-b border-border-subtle bg-bg-sidebar',
        'px-6',
      )}
    >
      <UserMenu />
    </header>
  );
}
