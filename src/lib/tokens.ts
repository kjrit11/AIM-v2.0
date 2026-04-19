/**
 * AIM v2 Design Tokens
 * =====================
 *
 * Typed source of truth for all visual properties.
 * All component code must import from here — never hardcode colors, spacing, etc.
 *
 * This file mirrors the CSS variables defined in `app/globals.css`.
 * The CSS variables power styles at runtime; this file provides a typed
 * structure for autocomplete and for code that needs to read tokens
 * programmatically (chart config, inline styles where a Tailwind class
 * is awkward, etc.).
 *
 * Dark-first at Phase 2. Light mode is deferred (see docs/DEFERRED.md).
 * See docs/STYLE_GUIDE.md for the full specification.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const colors = {
  // Neutrals — surfaces, borders, text (9 stops, named by role)
  bg: {
    page: 'var(--bg-page)',
    sidebar: 'var(--bg-sidebar)',
    surface: 'var(--bg-surface)',
    surfaceHover: 'var(--bg-surface-hover)',
  },

  border: {
    subtle: 'var(--border-subtle)',
    strong: 'var(--border-strong)',
  },

  text: {
    muted: 'var(--text-muted)',
    body: 'var(--text-body)',
    primary: 'var(--text-primary)',
  },

  // Accent — indigo, reserved for primary actions and brand moments.
  // Never used to encode data.
  accent: {
    DEFAULT: 'var(--accent)',
    hover: 'var(--accent-hover)',
    subtle: 'var(--accent-subtle)',
  },

  // Semantic pairs — always used together (fg + bg).
  // Each pair encodes a specific meaning; see STYLE_GUIDE.md §2.3.
  semantic: {
    success: { fg: 'var(--success-fg)', bg: 'var(--success-bg)' },
    warning: { fg: 'var(--warning-fg)', bg: 'var(--warning-bg)' },
    danger: { fg: 'var(--danger-fg)', bg: 'var(--danger-bg)' },
    info: { fg: 'var(--info-fg)', bg: 'var(--info-bg)' },
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
  // Page titles
  'page-title': { size: '20px', lineHeight: '28px', weight: 500 },
  section: { size: '16px', lineHeight: '24px', weight: 500 },

  // Body (14px is deliberate; 13px was rejected as too tight for text-heavy views)
  body: { size: '14px', lineHeight: '21px', weight: 400 },
  caption: { size: '12px', lineHeight: '16px', weight: 400 },

  // Micro — labels, eyebrows; use sparingly
  micro: {
    size: '11px',
    lineHeight: '14px',
    weight: 500,
    tracking: '0.06em',
    transform: 'uppercase',
  },

  // Mono (data) — numbers, IDs, timestamps
  mono: { size: '13px', lineHeight: '18px', weight: 400, family: 'mono' },
  'mono-sm': { size: '12px', lineHeight: '16px', weight: 400, family: 'mono' },
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
  inner: 'var(--shadow-inner)',
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
