'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import type { DatabricksUser } from '@/lib/databricksUser';

function initials(username: string, email: string): string {
  const source = username || email;
  if (source.length >= 2) return source.slice(0, 2).toUpperCase();
  return '??';
}

export function UserMenu({ user }: { user: DatabricksUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const label = initials(user.username, user.email);

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
            <div className="text-body text-text-primary">{user.username}</div>
            <div className="text-caption text-text-muted">{user.email}</div>
          </div>
        </div>
      )}
    </div>
  );
}
