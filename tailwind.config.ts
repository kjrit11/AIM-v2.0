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
      // Colors — all reference CSS variables from globals.css
      colors: {
        // Surfaces
        'bg-page': 'var(--bg-page)',
        'bg-panel': 'var(--bg-panel)',
        'bg-surface': 'var(--bg-surface)',

        // Text
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-quaternary': 'var(--text-quaternary)',

        // Brand + accent
        brand: 'var(--brand)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-active': 'var(--accent-active)',

        // Semantic status
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',

        // Borders
        'border-primary': 'var(--border-primary)',
        'border-subtle': 'var(--border-subtle)',
        'border-hairline': 'var(--border-hairline)',
      },

      // Typography
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },

      fontSize: {
        // STYLE_GUIDE §3.2
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '600' }],
        h1: ['28px', { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '600' }],
        h2: ['22px', { lineHeight: '30px', letterSpacing: '-0.01em', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '26px', letterSpacing: '0', fontWeight: '600' }],
        h4: ['15px', { lineHeight: '22px', letterSpacing: '0', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        body: ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '400' }],
        mono: ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'mono-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        eyebrow: [
          '11px',
          { lineHeight: '14px', letterSpacing: '0.06em', fontWeight: '500' },
        ],
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
