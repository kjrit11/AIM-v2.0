'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

/**
 * Sidebar — AIM v2 app shell
 * ============================
 *
 * Fixed-width (240px) left rail for authenticated routes. Matches
 * STYLE_GUIDE §6.5 — bg-bg-sidebar, hairline right border, subtle
 * active-state tint, 2px indigo accent bar on the active item.
 *
 * Active/disabled behavior:
 *   - Active: bg-bg-surface-hover + text-text-primary + 2px indigo left border
 *   - Inactive: text-text-body, hover brightens to text-text-primary with bg tint
 *   - Disabled (future-phase routes): text-text-muted, cursor-not-allowed,
 *     rendered as <span> (NOT <Link>) so the cursor and lack of href are honest
 *
 * The nav list is co-located here because it's trivially small and only
 * changes when a new module ships. When entries hit ~10, extract to a
 * config file alongside this component.
 */

type NavItem = {
  label: string;
  href: string;
  enabled: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', enabled: true },
  { label: 'Opportunities', href: '/opportunities', enabled: false },
  { label: 'Pricing', href: '/pricing', enabled: false },
  { label: 'Proposals', href: '/proposals', enabled: false },
  { label: 'Intelligence', href: '/intelligence', enabled: false },
  { label: 'Notepad', href: '/notepad', enabled: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'flex h-screen w-60 flex-col',
        'border-r border-border-subtle bg-bg-sidebar',
      )}
    >
      <div
        className={cn(
          'flex h-14 items-center border-b border-border-subtle px-4',
          'text-section text-text-primary',
        )}
      >
        AIM
      </div>

      <ul className="flex flex-col gap-1 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.enabled &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));

          if (!item.enabled) {
            return (
              <li key={item.href}>
                <span
                  aria-disabled="true"
                  className={cn(
                    'block border-l-2 border-l-transparent px-4 py-2',
                    'cursor-not-allowed text-body text-text-muted',
                  )}
                >
                  {item.label}
                </span>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'block border-l-2 px-4 py-2 text-body transition-colors duration-150',
                  isActive
                    ? 'border-l-accent bg-bg-surface-hover text-text-primary'
                    : 'border-l-transparent text-text-body hover:bg-bg-surface-hover hover:text-text-primary',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
