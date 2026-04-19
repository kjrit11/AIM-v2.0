/**
 * AIM v2 Design Tokens
 * =====================
 *
 * Typed source of truth for all visual properties.
 * All component code must import from here — never hardcode colors, spacing, etc.
 *
 * This file mirrors the CSS variables defined in `app/globals.css`.
 * The CSS variables are what actually power styles at runtime; this file
 * gives TypeScript a matching structure for autocomplete and type safety.
 *
 * Light mode only at Phase 1. Dark mode tokens are specified in docs/STYLE_GUIDE.md
 * §2.12 and will be layered in via `[data-theme="dark"]` when wired up later.
 *
 * See docs/STYLE_GUIDE.md for full specification.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const colors = {
  // Surfaces — the app, panels, cards
  bg: {
    page: 'var(--bg-page)',
    panel: 'var(--bg-panel)',
    surface: 'var(--bg-surface)',
  },

  // Text — primary to quaternary (primary = strongest, quaternary = placeholder/disabled)
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    tertiary: 'var(--text-tertiary)',
    quaternary: 'var(--text-quaternary)',
  },

  // Brand + interactive accents
  brand: 'var(--brand)',
  accent: {
    DEFAULT: 'var(--accent)',
    hover: 'var(--accent-hover)',
    active: 'var(--accent-active)',
  },

  // Semantic status — never decorative
  status: {
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    info: 'var(--info)',
  },

  // Borders + dividers
  border: {
    primary: 'var(--border-primary)',
    subtle: 'var(--border-subtle)',
    hairline: 'var(--border-hairline)',
  },
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const fonts = {
  sans: 'var(--font-sans)',
  mono: 'var(--font-mono)',
} as const;

export const type = {
  'display-lg': { size: '48px', lineHeight: '56px', weight: 600, tracking: '-0.02em' },

  h1: { size: '28px', lineHeight: '36px', weight: 600, tracking: '-0.01em' },
  h2: { size: '22px', lineHeight: '30px', weight: 600, tracking: '-0.01em' },
  h3: { size: '18px', lineHeight: '26px', weight: 600, tracking: '0' },
  h4: { size: '15px', lineHeight: '22px', weight: 600, tracking: '0' },

  'body-lg': { size: '16px', lineHeight: '24px', weight: 400 },
  body: { size: '14px', lineHeight: '20px', weight: 400 },
  'body-sm': { size: '13px', lineHeight: '18px', weight: 400 },
  caption: { size: '12px', lineHeight: '16px', weight: 400 },

  mono: { size: '13px', lineHeight: '18px', weight: 400, family: 'mono' },
  'mono-sm': { size: '12px', lineHeight: '16px', weight: 400, family: 'mono' },

  eyebrow: {
    size: '11px',
    lineHeight: '14px',
    weight: 500,
    tracking: '0.06em',
    transform: 'uppercase',
  },
} as const;

// ---------------------------------------------------------------------------
// Spacing — 4px base
// ---------------------------------------------------------------------------

export const space = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------

export const radius = {
  none: '0',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------

export const shadows = {
  ring: 'var(--shadow-ring)',
  subtle: 'var(--shadow-subtle)',
  card: 'var(--shadow-card)',
  elevated: 'var(--shadow-elevated)',
} as const;

// ---------------------------------------------------------------------------
// Layout constraints
// ---------------------------------------------------------------------------

export const layout = {
  maxWidth: '1280px',
  pagePaddingX: space[6],
  pagePaddingY: space[8],
  cardPadding: space[5],
  sectionGap: space[10],
  fieldGap: space[4],
} as const;
