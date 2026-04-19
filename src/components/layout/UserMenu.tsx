'use client';

import { signOut, useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

/**
 * UserMenu — AIM v2 app shell
 * =============================
 *
 * Avatar-triggered dropdown in the top bar. Shows the signed-in user's
 * full name + email and a Sign out action.
 *
 * Avatar initials derivation (STYLE_GUIDE §6.5 "Avatar"):
 *   1. Prefer given_name[0] + family_name[0] from Entra claims
 *   2. Fall back to first two letters of name
 *   3. Fall back to first two letters of email
 *   4. Final fallback: "??" (session should always populate at least email)
 *
 * Dropdown closes on:
 *   - Outside click
 *   - Route change (pathname tracked via usePathname)
 *   - Escape key
 *
 * Sign-out redirects to the unauthenticated landing page (`/`).
 */

function initials(
  given: string | null | undefined,
  family: string | null | undefined,
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  if (given && family) {
    return `${given[0]}${family[0]}`.toUpperCase();
  }
  if (name && name.trim().length >= 2) {
    return name.trim().slice(0, 2).toUpperCase();
  }
  if (email && email.length >= 2) {
    return email.slice(0, 2).toUpperCase();
  }
  return '??';
}

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const user = session?.user;
  const label = initials(
    user?.given_name,
    user?.family_name,
    user?.name,
    user?.email,
  );
  const displayName = user?.name ?? user?.email ?? 'Signed in';
  const displayEmail = user?.email ?? '';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open user menu"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full',
          'bg-accent-subtle text-accent-hover',
          'text-caption font-medium',
          'transition-colors duration-150',
          'hover:brightness-110',
        )}
      >
        {label}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="User menu"
          className={cn(
            'absolute right-0 top-10 z-50 min-w-60',
            'rounded-md border border-border-subtle bg-bg-surface',
            'shadow-elevated',
          )}
        >
          <div className="px-4 py-3">
            <div className="text-body text-text-primary">{displayName}</div>
            {displayEmail ? (
              <div className="text-caption text-text-muted">{displayEmail}</div>
            ) : null}
          </div>
          <div className="border-t border-border-subtle" />
          <button
            type="button"
            role="menuitem"
            onClick={() => void signOut({ callbackUrl: '/' })}
            className={cn(
              'w-full px-4 py-2 text-left text-body',
              'text-text-body transition-colors duration-150',
              'hover:bg-bg-surface-hover hover:text-text-primary',
            )}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
