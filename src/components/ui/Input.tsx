import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Input primitive — STYLE_GUIDE §6.2
 * ====================================
 *
 * Single height (36px), single radius (md), single border treatment.
 * Error state flips border and ring to semantic danger.
 *
 * Focus state:
 *   - Border turns border-strong
 *   - 3px ring at ~20% accent-hover opacity (soft indigo halo)
 *
 * Not included here (Phase 2+):
 *   - Label composition (caller wraps in <label> or uses aria-labelledby)
 *   - Prefix/suffix icons
 *   - Helper text rendering (caller responsibility for now)
 *
 * Textarea is NOT a variant of Input — it gets its own component later.
 * STYLE_GUIDE specifies same visual treatment, but auto-height + resize handling
 * is different enough to warrant separation.
 */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error = false, type = 'text', ...rest }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={error || undefined}
        className={cn(
          // Shape + base
          'h-9 w-full px-3',
          'rounded-md border',
          'bg-bg-surface text-text-strong',
          'text-body',
          'transition-[border-color,box-shadow] duration-150',

          // Placeholder
          'placeholder:text-text-muted',

          // Border state (default vs error)
          error ? 'border-danger-fg' : 'border-border-subtle',

          // Focus — stronger ring via focus-visible, overrides the globals.css outline
          'focus-visible:outline-none',
          error
            ? 'focus-visible:border-danger-fg focus-visible:ring-2 focus-visible:ring-danger-fg/20'
            : 'focus-visible:border-border-strong focus-visible:ring-[3px] focus-visible:ring-accent-hover/20',

          // Disabled
          'disabled:opacity-50 disabled:cursor-not-allowed',

          // Caller overrides
          className
        )}
        {...rest}
      />
    );
  }
);

Input.displayName = 'Input';
