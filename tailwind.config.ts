import type { Config } from 'tailwindcss';

/**
 * Tailwind config — AIM v2
 * =========================
 *
 * Tailwind utility names map 1:1 to CSS variables from globals.css.
 *
 * Never add `fontFamily: { foo: 'comic sans' }`-style hardcoded values here.
 * If a new token is needed, add it to both globals.css (as --var) AND here
 * (as a utility reference to that var) and lib/tokens.ts (as typed export).
 *
 * Why CSS variables instead of JS values in this config:
 *  - Lets us flip light/dark mode later by overriding vars, without rebuilding
 *  - Keeps a single runtime source of truth
 *  - Storybook/Figma-free: designers see the same vars as developers
 */

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Colors — every utility reads a CSS variable from globals.css.
      // Structure mirrors STYLE_GUIDE.md §2 (neutrals / accent / semantic).
      colors: {
        // Neutral surfaces (bg-page, bg-sidebar, bg-surface, bg-surface-hover)
        bg: {
          page: 'var(--bg-page)',
          sidebar: 'var(--bg-sidebar)',
          surface: 'var(--bg-surface)',
          'surface-hover': 'var(--bg-surface-hover)',
        },

        // Borders (border-subtle, border-strong)
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },

        // Text (text-muted, text-body, text-primary — 3 tiers)
        text: {
          muted: 'var(--text-muted)',
          body: 'var(--text-body)',
          primary: 'var(--text-primary)',
        },

        // Accent — indigo (accent, accent-hover, accent-subtle)
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
        },

        // Semantic pairs — use fg/bg together
        success: { fg: 'var(--success-fg)', bg: 'var(--success-bg)' },
        warning: { fg: 'var(--warning-fg)', bg: 'var(--warning-bg)' },
        danger: { fg: 'var(--danger-fg)', bg: 'var(--danger-bg)' },
        info: { fg: 'var(--info-fg)', bg: 'var(--info-bg)' },
      },

      // Typography — Inter + JetBrains Mono wired via next/font in layout.tsx
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },

      // Scale — STYLE_GUIDE §3.2
      fontSize: {
        micro: [
          '11px',
          { lineHeight: '14px', letterSpacing: '0.06em', fontWeight: '500' },
        ],
        caption: ['12px', { lineHeight: '16px', fontWeight: '400' }],
        body: ['14px', { lineHeight: '21px', fontWeight: '400' }],
        section: ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'page-title': ['20px', { lineHeight: '28px', fontWeight: '500' }],
        mono: ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'mono-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },

      // Spacing — 4px base, fully enumerated
      spacing: {
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
      },

      // Radius
      borderRadius: {
        none: '0',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        full: '9999px',
      },

      // Shadows — wrappers around CSS variables so class names are portable
      boxShadow: {
        ring: 'var(--shadow-ring)',
        subtle: 'var(--shadow-subtle)',
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        inner: 'var(--shadow-inner)',
      },

      // Max width for page shells
      maxWidth: {
        page: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
