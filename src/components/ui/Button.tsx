import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Button primitive — STYLE_GUIDE §6.1
 * =====================================
 *
 * Four variants: primary (indigo), secondary (outlined), ghost, danger.
 * Three sizes: sm (28px), md (36px, default), lg (44px).
 *
 * Visual rules:
 *   - Border radius: md (6px)
 *   - Font: body (14px) at md/lg, caption (12px) at sm
 *   - Weight: 500 across all variants/sizes
 *   - Hover: accent-hover (primary) or surface-hover (secondary/ghost)
 *   - Focus: 2px accent-hover ring, 2px offset (handled by globals.css *:focus-visible)
 *   - Disabled: 50% opacity, no pointer events
 *
 * Accessibility:
 *   - Uses native <button> for semantic correctness and keyboard support
 *   - Disabled state correctly blocks events
 *
 * Not yet included (Phase 2+):
 *   - Icon prefix/suffix composition
 *   - Loading spinner
 *   - Link variant (<a> styled as button)
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-accent text-text-primary border-transparent',
    'hover:bg-accent-hover',
    'active:bg-accent-hover'
  ),
  secondary: cn(
    'bg-bg-surface text-text-body border-border-subtle',
    'hover:bg-bg-surface-hover',
    'active:bg-bg-surface-hover'
  ),
  ghost: cn(
    'bg-transparent text-text-body border-transparent',
    'hover:bg-bg-surface-hover hover:text-text-primary',
    'active:bg-bg-surface-hover'
  ),
  danger: cn(
    'bg-danger-bg text-danger-fg border-transparent',
    'hover:brightness-110',
    'active:brightness-95'
  ),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-caption',   // 28px
  md: 'h-9 px-4 text-body',      // 36px
  lg: 'h-11 px-5 text-body',     // 44px
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          // Base — every button
          'inline-flex items-center justify-center',
          'rounded-md border',
          'font-medium',
          'transition-colors duration-150',
          'disabled:opacity-50 disabled:pointer-events-none',

          // Variant
          variantClasses[variant],

          // Size
          sizeClasses[size],

          // Caller overrides
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
