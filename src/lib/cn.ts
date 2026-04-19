import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compose class names with conflict resolution.
 *
 * `clsx` handles conditional classes and arrays.
 * `tailwind-merge` resolves conflicts (e.g., `px-2 px-4` → `px-4`).
 *
 * Usage:
 *   cn('px-4 py-2', condition && 'bg-accent', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
