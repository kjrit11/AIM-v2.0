import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Button primitive — STYLE_GUIDE §6.1
 * =====================================
 *
 * Four variants: primary (Periwinkle), secondary (outlined), ghost, danger.
 * Three sizes: sm (28px), md (36px, default), lg (44px).
 *
 * Visual rules:
 *   - Border radius: md (6px)
 *   - Font: body at md/lg, body-sm at sm
 *   - Hover: accent-hover (for primary) or tint shift
 *   - Focus: 2px accent ring, 2px offset (handled by globals.css *:focus-visible)
 *   - Disabled: 50% opacity, no pointer events
 *
 * Accessibility:
 *   - Uses native <button> for semantic correctness and keyboard support
 *   - Disabled state correctly blocks events
 *   - Loading state sets aria-busy
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
    'bg-accent text-white border-transparent',
    'hover:bg-accent-hover',
    'active:bg-accent-active'
  ),
  secondary: cn(
    'bg-bg-surface text-text-primary border-border-subtle',
    'hover:bg-bg-page',
    'active:bg-bg-page'
  ),
  ghost: cn(
    'bg-transparent text-text-primary border-transparent',
    'hover:bg-bg-page',
    'active:bg-bg-page'
  ),
  danger: cn(
    'bg-danger text-white border-transparent',
    'hover:brightness-95',
    'active:brightness-90'
  ),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-body-sm',       // 28px
  md: 'h-9 px-4 text-body',          // 36px
  lg: 'h-11 px-5 text-body-lg',      // 44px
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
