import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Card primitive — STYLE_GUIDE §6.3
 * ===================================
 *
 * Standard visual container. Light surface, subtle border, slight shadow.
 * No gradients, no heavier shadow by default.
 *
 * Interactive prop:
 *   - When `interactive`, adds hover background tint and cursor-pointer
 *   - Does NOT change border color on hover (per STYLE_GUIDE)
 *   - Does NOT add onClick — caller provides it; this just signals interactivity
 *
 * Composition:
 *   - Card is a plain container. Card.Header / Card.Body / Card.Footer
 *     subcomponents can be added in Phase 2 when we have use cases that need them.
 *     For now, callers compose with raw divs.
 */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Shape + surface
          'rounded-lg border border-border-subtle',
          'bg-bg-surface',
          'p-5',
          'shadow-card',

          // Interactive
          interactive && cn(
            'cursor-pointer',
            'transition-colors duration-150',
            'hover:bg-bg-page'
          ),

          // Caller overrides
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
