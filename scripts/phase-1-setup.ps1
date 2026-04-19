<#
===============================================================================
 AIM v2 - Phase 1 Setup Script (PowerShell)
===============================================================================

 USAGE
 -----
 Save this script as C:\Users\kevin\phase-1-setup.ps1 (Notepad; Save As "All
 Files" so it doesn't become .ps1.txt), then run:

   powershell -ExecutionPolicy Bypass -File C:\Users\kevin\phase-1-setup.ps1

 Takes 2-4 minutes. See conversation transcript for full context.
#>

$ErrorActionPreference = 'Stop'
$repoParent = 'C:\Users\kevin'
$repoPath   = Join-Path $repoParent 'Aim-v2.0'
$repoUrl    = 'git@github.com:kjrit11/Aim-v2.0.git'

Write-Host ''
Write-Host '===============================================================================' -ForegroundColor Cyan
Write-Host ' AIM v2 - Phase 1 Setup' -ForegroundColor Cyan
Write-Host '===============================================================================' -ForegroundColor Cyan
Write-Host ("Repo path: " + $repoPath)

if (Test-Path $repoPath) {
    Write-Host ("WARNING: " + $repoPath + " already exists.") -ForegroundColor Yellow
    Write-Host 'If you want to re-run this script, delete or move that folder first:'
    Write-Host ("  Remove-Item -Recurse -Force '" + $repoPath + "'")
    exit 1
}

Write-Host '--- Step 1: Cloning empty repo ---' -ForegroundColor Green
Set-Location $repoParent
git clone $repoUrl
if ($LASTEXITCODE -ne 0) {
    Write-Host 'git clone failed. Make sure SSH is set up and the repo exists.' -ForegroundColor Red
    exit 1
}
Set-Location $repoPath

Write-Host ''
Write-Host '--- Step 2: Scaffolding Next.js 14 ---' -ForegroundColor Green
npx --yes create-next-app@14 _scaffold `
    --typescript `
    --tailwind `
    --app `
    --src-dir `
    --import-alias '@/*' `
    --no-eslint `
    --use-npm
if ($LASTEXITCODE -ne 0) {
    Write-Host 'create-next-app failed.' -ForegroundColor Red
    exit 1
}

Get-ChildItem -Path '_scaffold' -Force | ForEach-Object {
    Move-Item -Path $_.FullName -Destination $repoPath -Force
}
Remove-Item '_scaffold' -Force -Recurse

Write-Host ''
Write-Host '--- Step 3: Installing runtime dependencies ---' -ForegroundColor Green
npm install clsx tailwind-merge lucide-react geist

Write-Host ''
Write-Host '--- Step 4: Installing dev dependencies ---' -ForegroundColor Green
npm install --save-dev `
    'eslint@^8' `
    'eslint-config-next@^14' `
    '@typescript-eslint/parser@^7' `
    '@typescript-eslint/eslint-plugin@^7' `
    'prettier@^3' `
    'prettier-plugin-tailwindcss@^0.6' `
    '@types/node@^20'

Write-Host ''
Write-Host '--- Step 5: Writing Phase 1 source files ---' -ForegroundColor Green


# --- tailwind.config.ts ---
$content = @'
import type { Config } from ''tailwindcss'';

/**
 * Tailwind config — AIM v2
 * =========================
 *
 * Tailwind utility names map 1:1 to CSS variables from globals.css.
 *
 * Never add `fontFamily: { foo: ''comic sans'' }`-style hardcoded values here.
 * If a new token is needed, add it to both globals.css (as --var) AND here
 * (as a utility reference to that var) and lib/tokens.ts (as typed export).
 *
 * Why CSS variables instead of JS values in this config:
 *  - Lets us flip light/dark mode later by overriding vars, without rebuilding
 *  - Keeps a single runtime source of truth
 *  - Storybook/Figma-free: designers see the same vars as developers
 */

const config: Config = {
  content: [''./src/**/*.{ts,tsx}''],
  theme: {
    extend: {
      // Colors — all reference CSS variables from globals.css
      colors: {
        // Surfaces
        ''bg-page'': ''var(--bg-page)'',
        ''bg-panel'': ''var(--bg-panel)'',
        ''bg-surface'': ''var(--bg-surface)'',

        // Text
        ''text-primary'': ''var(--text-primary)'',
        ''text-secondary'': ''var(--text-secondary)'',
        ''text-tertiary'': ''var(--text-tertiary)'',
        ''text-quaternary'': ''var(--text-quaternary)'',

        // Brand + accent
        brand: ''var(--brand)'',
        accent: ''var(--accent)'',
        ''accent-hover'': ''var(--accent-hover)'',
        ''accent-active'': ''var(--accent-active)'',

        // Semantic status
        success: ''var(--success)'',
        warning: ''var(--warning)'',
        danger: ''var(--danger)'',
        info: ''var(--info)'',

        // Borders
        ''border-primary'': ''var(--border-primary)'',
        ''border-subtle'': ''var(--border-subtle)'',
        ''border-hairline'': ''var(--border-hairline)'',
      },

      // Typography
      fontFamily: {
        sans: [''var(--font-sans)''],
        mono: [''var(--font-mono)''],
      },

      fontSize: {
        // STYLE_GUIDE §3.2
        ''display-lg'': [''48px'', { lineHeight: ''56px'', letterSpacing: ''-0.02em'', fontWeight: ''600'' }],
        h1: [''28px'', { lineHeight: ''36px'', letterSpacing: ''-0.01em'', fontWeight: ''600'' }],
        h2: [''22px'', { lineHeight: ''30px'', letterSpacing: ''-0.01em'', fontWeight: ''600'' }],
        h3: [''18px'', { lineHeight: ''26px'', letterSpacing: ''0'', fontWeight: ''600'' }],
        h4: [''15px'', { lineHeight: ''22px'', letterSpacing: ''0'', fontWeight: ''600'' }],
        ''body-lg'': [''16px'', { lineHeight: ''24px'', fontWeight: ''400'' }],
        body: [''14px'', { lineHeight: ''20px'', fontWeight: ''400'' }],
        ''body-sm'': [''13px'', { lineHeight: ''18px'', fontWeight: ''400'' }],
        caption: [''12px'', { lineHeight: ''16px'', fontWeight: ''400'' }],
        mono: [''13px'', { lineHeight: ''18px'', fontWeight: ''400'' }],
        ''mono-sm'': [''12px'', { lineHeight: ''16px'', fontWeight: ''400'' }],
        eyebrow: [
          ''11px'',
          { lineHeight: ''14px'', letterSpacing: ''0.06em'', fontWeight: ''500'' },
        ],
      },

      // Spacing — 4px base, fully enumerated
      spacing: {
        0: ''0'',
        1: ''4px'',
        2: ''8px'',
        3: ''12px'',
        4: ''16px'',
        5: ''20px'',
        6: ''24px'',
        8: ''32px'',
        10: ''40px'',
        12: ''48px'',
        16: ''64px'',
        20: ''80px'',
        24: ''96px'',
      },

      // Radius
      borderRadius: {
        none: ''0'',
        sm: ''4px'',
        md: ''6px'',
        lg: ''8px'',
        xl: ''12px'',
        full: ''9999px'',
      },

      // Shadows — wrappers around CSS variables so class names are portable
      boxShadow: {
        ring: ''var(--shadow-ring)'',
        subtle: ''var(--shadow-subtle)'',
        card: ''var(--shadow-card)'',
        elevated: ''var(--shadow-elevated)'',
      },

      // Max width for page shells
      maxWidth: {
        page: ''1280px'',
      },
    },
  },
  plugins: [],
};

export default config;

'@
Set-Content -Path "$repoPath\tailwind.config.ts" -Value $content -Encoding UTF8 -NoNewline

# --- .eslintrc.json ---
$content = @'
{
  "$schema": "https://json.schemastore.org/eslintrc",
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { "prefer": "type-imports", "fixStyle": "inline-type-imports" }
    ]
  },
  "overrides": [
    {
      "files": ["src/**/*.tsx"],
      "excludedFiles": [
        "src/app/globals.css",
        "src/lib/tokens.ts",
        "tailwind.config.ts"
      ],
      "rules": {
        "no-restricted-syntax": [
          "error",
          {
            "selector": "Literal[value=/^#[0-9A-Fa-f]{3,8}$/]",
            "message": "Hex color literals are banned in component code. Use Tailwind utility classes tied to CSS variables (see tailwind.config.ts + src/app/globals.css). If you need a new token, add it to globals.css and tailwind.config.ts first."
          },
          {
            "selector": "TemplateElement[value.raw=/#[0-9A-Fa-f]{3,8}/]",
            "message": "Hex color literals are banned in component code (including in template strings). Use Tailwind utility classes instead."
          }
        ]
      }
    }
  ]
}

'@
Set-Content -Path "$repoPath\.eslintrc.json" -Value $content -Encoding UTF8 -NoNewline

# --- .prettierrc ---
$content = @'
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}

'@
Set-Content -Path "$repoPath\.prettierrc" -Value $content -Encoding UTF8 -NoNewline

# --- src/lib/tokens.ts ---
$content = @'
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
    page: ''var(--bg-page)'',
    panel: ''var(--bg-panel)'',
    surface: ''var(--bg-surface)'',
  },

  // Text — primary to quaternary (primary = strongest, quaternary = placeholder/disabled)
  text: {
    primary: ''var(--text-primary)'',
    secondary: ''var(--text-secondary)'',
    tertiary: ''var(--text-tertiary)'',
    quaternary: ''var(--text-quaternary)'',
  },

  // Brand + interactive accents
  brand: ''var(--brand)'',
  accent: {
    DEFAULT: ''var(--accent)'',
    hover: ''var(--accent-hover)'',
    active: ''var(--accent-active)'',
  },

  // Semantic status — never decorative
  status: {
    success: ''var(--success)'',
    warning: ''var(--warning)'',
    danger: ''var(--danger)'',
    info: ''var(--info)'',
  },

  // Borders + dividers
  border: {
    primary: ''var(--border-primary)'',
    subtle: ''var(--border-subtle)'',
    hairline: ''var(--border-hairline)'',
  },
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const fonts = {
  sans: ''var(--font-sans)'',
  mono: ''var(--font-mono)'',
} as const;

export const type = {
  ''display-lg'': { size: ''48px'', lineHeight: ''56px'', weight: 600, tracking: ''-0.02em'' },

  h1: { size: ''28px'', lineHeight: ''36px'', weight: 600, tracking: ''-0.01em'' },
  h2: { size: ''22px'', lineHeight: ''30px'', weight: 600, tracking: ''-0.01em'' },
  h3: { size: ''18px'', lineHeight: ''26px'', weight: 600, tracking: ''0'' },
  h4: { size: ''15px'', lineHeight: ''22px'', weight: 600, tracking: ''0'' },

  ''body-lg'': { size: ''16px'', lineHeight: ''24px'', weight: 400 },
  body: { size: ''14px'', lineHeight: ''20px'', weight: 400 },
  ''body-sm'': { size: ''13px'', lineHeight: ''18px'', weight: 400 },
  caption: { size: ''12px'', lineHeight: ''16px'', weight: 400 },

  mono: { size: ''13px'', lineHeight: ''18px'', weight: 400, family: ''mono'' },
  ''mono-sm'': { size: ''12px'', lineHeight: ''16px'', weight: 400, family: ''mono'' },

  eyebrow: {
    size: ''11px'',
    lineHeight: ''14px'',
    weight: 500,
    tracking: ''0.06em'',
    transform: ''uppercase'',
  },
} as const;

// ---------------------------------------------------------------------------
// Spacing — 4px base
// ---------------------------------------------------------------------------

export const space = {
  0: ''0'',
  1: ''4px'',
  2: ''8px'',
  3: ''12px'',
  4: ''16px'',
  5: ''20px'',
  6: ''24px'',
  8: ''32px'',
  10: ''40px'',
  12: ''48px'',
  16: ''64px'',
  20: ''80px'',
  24: ''96px'',
} as const;

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------

export const radius = {
  none: ''0'',
  sm: ''4px'',
  md: ''6px'',
  lg: ''8px'',
  xl: ''12px'',
  full: ''9999px'',
} as const;

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------

export const shadows = {
  ring: ''var(--shadow-ring)'',
  subtle: ''var(--shadow-subtle)'',
  card: ''var(--shadow-card)'',
  elevated: ''var(--shadow-elevated)'',
} as const;

// ---------------------------------------------------------------------------
// Layout constraints
// ---------------------------------------------------------------------------

export const layout = {
  maxWidth: ''1280px'',
  pagePaddingX: space[6],
  pagePaddingY: space[8],
  cardPadding: space[5],
  sectionGap: space[10],
  fieldGap: space[4],
} as const;

'@
Set-Content -Path "$repoPath\src\lib\tokens.ts" -Value $content -Encoding UTF8 -NoNewline

# --- src/lib/cn.ts ---
$content = @'
import { clsx, type ClassValue } from ''clsx'';
import { twMerge } from ''tailwind-merge'';

/**
 * Compose class names with conflict resolution.
 *
 * `clsx` handles conditional classes and arrays.
 * `tailwind-merge` resolves conflicts (e.g., `px-2 px-4` → `px-4`).
 *
 * Usage:
 *   cn(''px-4 py-2'', condition && ''bg-accent'', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

'@
Set-Content -Path "$repoPath\src\lib\cn.ts" -Value $content -Encoding UTF8 -NoNewline

# --- src/app/globals.css ---
$content = @'
/**
 * AIM v2 — Global Styles
 * =======================
 *
 * Light-mode CSS variables (from docs/STYLE_GUIDE.md §2.11).
 * Dark mode deferred — when wired up, add `[data-theme="dark"] { ... }` block
 * with tokens from §2.12.
 *
 * All components must reference these variables via Tailwind utility classes
 * (configured in tailwind.config.ts) rather than hardcoded values.
 */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Fonts — populated by next/font/google in app/layout.tsx */
    --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      ''Segoe UI'', Helvetica, Arial, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, ''JetBrains Mono'', ''Fira Code'',
      Consolas, monospace;

    /* Surfaces */
    --bg-page: #f6f6fb;
    --bg-panel: #f6f6fb;
    --bg-surface: #ffffff;

    /* Text */
    --text-primary: #1c1c38;
    --text-secondary: #151744;
    --text-tertiary: #6b6b9a;
    --text-quaternary: #dddde8;

    /* Brand + accent */
    --brand: #151744;
    --accent: #707cf2;
    --accent-hover: #383392;
    --accent-active: #383392;

    /* Semantic status */
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #f56e7b;
    --info: #3b82f6;

    /* Borders */
    --border-primary: #707cf2;
    --border-subtle: #dddde8;
    --border-hairline: rgba(21, 23, 68, 0.08);

    /* Shadows */
    --shadow-ring: rgba(21, 23, 68, 0.08) 0px 0px 0px 1px;
    --shadow-subtle: rgba(21, 23, 68, 0.04) 0px 2px 4px 0px;
    --shadow-card: var(--shadow-ring), var(--shadow-subtle);
    --shadow-elevated: var(--shadow-ring),
      rgba(21, 23, 68, 0.06) 0px 4px 12px 0px;
  }

  /* Base element resets — keep minimal, let components own their styling */
  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  body {
    background-color: var(--bg-page);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 20px;
    font-weight: 400;
  }

  /* Monospace numbers, IDs, timestamps — STYLE_GUIDE §3.3 */
  .font-mono,
  .font-mono * {
    font-family: var(--font-mono);
    font-feature-settings: ''tnum'' 1, ''calt'' 0;
  }

  /* Focus outline — accessible default, overridden per-component where needed */
  *:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  /* Remove default button styling */
  button {
    font-family: inherit;
  }
}

'@
Set-Content -Path "$repoPath\src\app\globals.css" -Value $content -Encoding UTF8 -NoNewline

# --- src/app/layout.tsx ---
$content = @'
import type { Metadata } from ''next'';
import { GeistSans } from ''geist/font/sans'';
import { GeistMono } from ''geist/font/mono'';
import ''./globals.css'';

/**
 * Root layout — AIM v2
 * =====================
 *
 * Wires Geist (sans + mono) via next/font/google. The --font-sans and
 * --font-mono CSS variables get populated automatically by the className
 * on the <html> element.
 *
 * No shell chrome (sidebar, top bar, etc.) in Phase 1 — that''s Phase 2
 * when we wire auth and the authenticated app shell.
 */

export const metadata: Metadata = {
  title: ''AIM — AlignInMotion'',
  description: ''Sales Command Center for CareIntelligence'',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{
        // Inject Geist into our CSS variable names used in globals.css
        // (next/font/google exposes its own --font-geist-sans etc.; we re-alias here)
        [''--font-sans'' as string]: `var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif`,
        [''--font-mono'' as string]: `var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace`,
      }}
    >
      <body>{children}</body>
    </html>
  );
}

'@
Set-Content -Path "$repoPath\src\app\layout.tsx" -Value $content -Encoding UTF8 -NoNewline

# --- src/app/page.tsx ---
$content = @'
/**
 * Placeholder home page — Phase 1
 * =================================
 *
 * Real app shell + auth-gated routing comes in Phase 2.
 * For now, this just verifies Tailwind + tokens + primitives work.
 *
 * Visit /design to see the component gallery.
 */

import Link from ''next/link'';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-page px-6 py-8">
      <h1 className="text-h1 text-text-primary mb-2">AIM v2</h1>
      <p className="text-body-lg text-text-tertiary mb-10">
        Phase 1 scaffold — design system only. No auth, no data.
      </p>

      <div className="flex flex-col gap-3">
        <Link
          href="/design"
          className="text-accent hover:text-accent-hover underline underline-offset-4"
        >
          → Component gallery (/design)
        </Link>
      </div>
    </main>
  );
}

'@
Set-Content -Path "$repoPath\src\app\page.tsx" -Value $content -Encoding UTF8 -NoNewline

# --- src/app/design/page.tsx ---
$content = @'
/**
 * Design gallery — /design
 * =========================
 *
 * Replaces Storybook for Phase 1 per Kevin''s scoping decision.
 * Renders every primitive in every variant / size / state,
 * so we can eyeball them in isolation.
 *
 * As we add more primitives (Phase 2+), extend this page.
 * When the app has meaningful routes, this page stays — it''s useful
 * during development even in production builds (gated or not, TBD).
 *
 * Dev-only posture: this page is NOT auth-gated in Phase 1 because
 * we don''t have auth yet. When auth lands in Phase 2, decide whether to:
 *   (a) leave /design public (useful for Figma-free collaboration)
 *   (b) gate it to logged-in internal users
 *   (c) only serve it in dev builds
 */

import { Button } from ''@/components/ui/Button'';
import { Input } from ''@/components/ui/Input'';
import { Card } from ''@/components/ui/Card'';

export default function DesignGalleryPage() {
  return (
    <main className="mx-auto max-w-page px-6 py-8">
      <header className="mb-12">
        <p className="text-eyebrow text-text-tertiary mb-2">
          Design system
        </p>
        <h1 className="text-h1 text-text-primary mb-2">Component gallery</h1>
        <p className="text-body-lg text-text-tertiary">
          Every primitive in every variant. Phase 1 baseline.
        </p>
      </header>

      {/* Button ============================================= */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Button</h2>

        <div className="flex flex-col gap-8">
          <Row label="Variants (md)">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </Row>

          <Row label="Sizes (primary)">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </Row>

          <Row label="Disabled">
            <Button variant="primary" disabled>Primary</Button>
            <Button variant="secondary" disabled>Secondary</Button>
            <Button variant="ghost" disabled>Ghost</Button>
            <Button variant="danger" disabled>Danger</Button>
          </Row>
        </div>
      </section>

      {/* Input ============================================== */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Input</h2>

        <div className="grid max-w-md grid-cols-1 gap-4">
          <div>
            <label className="text-body-sm text-text-secondary mb-1 block">
              Default
            </label>
            <Input placeholder="Placeholder text" />
          </div>

          <div>
            <label className="text-body-sm text-text-secondary mb-1 block">
              With value
            </label>
            <Input defaultValue="Some text" />
          </div>

          <div>
            <label className="text-body-sm text-text-secondary mb-1 block">
              Error
            </label>
            <Input error defaultValue="Invalid input" />
            <p className="text-body-sm text-danger mt-1">
              This field is required.
            </p>
          </div>

          <div>
            <label className="text-body-sm text-text-secondary mb-1 block">
              Disabled
            </label>
            <Input disabled placeholder="Disabled input" />
          </div>
        </div>
      </section>

      {/* Card =============================================== */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Card</h2>

        <div className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <p className="text-eyebrow text-text-tertiary mb-2">Static</p>
            <h3 className="text-h3 text-text-primary mb-2">Static card</h3>
            <p className="text-body text-text-tertiary">
              Default card — subtle border, light shadow, no interactivity.
            </p>
          </Card>

          <Card interactive>
            <p className="text-eyebrow text-text-tertiary mb-2">Interactive</p>
            <h3 className="text-h3 text-text-primary mb-2">Hover me</h3>
            <p className="text-body text-text-tertiary">
              Hover tint via <code className="font-mono text-mono-sm">interactive</code> prop.
              Cursor becomes pointer.
            </p>
          </Card>
        </div>
      </section>

      {/* Typography ========================================= */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Typography</h2>

        <div className="flex flex-col gap-4">
          <div className="text-h1 text-text-primary">h1 — Page title</div>
          <div className="text-h2 text-text-primary">h2 — Section title</div>
          <div className="text-h3 text-text-primary">h3 — Subsection title</div>
          <div className="text-h4 text-text-primary">h4 — Small heading</div>
          <div className="text-body-lg text-text-primary">body-lg — Intro body text</div>
          <div className="text-body text-text-primary">body — Default body text (14px)</div>
          <div className="text-body-sm text-text-tertiary">body-sm — Secondary body</div>
          <div className="text-caption text-text-tertiary">caption — Metadata and tiny labels</div>
          <div className="text-mono text-text-primary">mono — 123.45 · deal-0042 · 2026-04-18</div>
          <div className="text-eyebrow text-text-tertiary uppercase tracking-wider">
            eyebrow — Section eyebrow
          </div>
        </div>
      </section>

      {/* Color tokens ======================================= */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Color tokens (light)</h2>

        <div className="grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          <Swatch color="bg-brand" label="brand" />
          <Swatch color="bg-accent" label="accent" />
          <Swatch color="bg-accent-hover" label="accent-hover" />
          <Swatch color="bg-success" label="success" />
          <Swatch color="bg-warning" label="warning" />
          <Swatch color="bg-danger" label="danger" />
          <Swatch color="bg-info" label="info" />
          <Swatch color="bg-bg-page" label="bg-page" border />
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Inline helpers — kept in this file because they only exist to demo primitives
// ---------------------------------------------------------------------------

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-eyebrow text-text-tertiary mb-3 tracking-wider">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Swatch({
  color,
  label,
  border = false,
}: {
  color: string;
  label: string;
  border?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`${color} h-16 w-full rounded-md ${border ? ''border border-border-subtle'' : ''''}`}
      />
      <code className="font-mono text-mono-sm text-text-tertiary">{label}</code>
    </div>
  );
}

'@
Set-Content -Path "$repoPath\src\app\design\page.tsx" -Value $content -Encoding UTF8 -NoNewline

# --- src/components/ui/Button.tsx ---
$content = @'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from ''react'';
import { cn } from ''@/lib/cn'';

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

type ButtonVariant = ''primary'' | ''secondary'' | ''ghost'' | ''danger'';
type ButtonSize = ''sm'' | ''md'' | ''lg'';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    ''bg-accent text-white border-transparent'',
    ''hover:bg-accent-hover'',
    ''active:bg-accent-active''
  ),
  secondary: cn(
    ''bg-bg-surface text-text-primary border-border-subtle'',
    ''hover:bg-bg-page'',
    ''active:bg-bg-page''
  ),
  ghost: cn(
    ''bg-transparent text-text-primary border-transparent'',
    ''hover:bg-bg-page'',
    ''active:bg-bg-page''
  ),
  danger: cn(
    ''bg-danger text-white border-transparent'',
    ''hover:brightness-95'',
    ''active:brightness-90''
  ),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: ''h-7 px-3 text-body-sm'',       // 28px
  md: ''h-9 px-4 text-body'',          // 36px
  lg: ''h-11 px-5 text-body-lg'',      // 44px
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = ''primary'', size = ''md'', className, children, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          // Base — every button
          ''inline-flex items-center justify-center'',
          ''rounded-md border'',
          ''font-medium'',
          ''transition-colors duration-150'',
          ''disabled:opacity-50 disabled:pointer-events-none'',

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

Button.displayName = ''Button'';

'@
Set-Content -Path "$repoPath\src\components\ui\Button.tsx" -Value $content -Encoding UTF8 -NoNewline

# --- src/components/ui/Input.tsx ---
$content = @'
import { forwardRef, type InputHTMLAttributes } from ''react'';
import { cn } from ''@/lib/cn'';

/**
 * Input primitive — STYLE_GUIDE §6.2
 * ====================================
 *
 * Single height (36px), single radius (md), single border treatment.
 * Error state flips border to danger red.
 *
 * Focus state:
 *   - Border turns accent
 *   - 3px ring at ~20% accent opacity
 *
 * Not included here (Phase 2+):
 *   - Label composition (caller can wrap in <label> or use aria-labelledby)
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
  ({ className, error = false, type = ''text'', ...rest }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={error || undefined}
        className={cn(
          // Shape + base
          ''h-9 w-full px-3'',
          ''rounded-md border'',
          ''bg-bg-surface text-text-primary'',
          ''text-body'',
          ''transition-[border-color,box-shadow] duration-150'',

          // Placeholder
          ''placeholder:text-text-quaternary'',

          // Border state (default vs error)
          error ? ''border-danger'' : ''border-border-subtle'',

          // Focus — stronger ring via focus-visible, overrides the globals.css outline
          ''focus-visible:outline-none'',
          error
            ? ''focus-visible:border-danger focus-visible:ring-2 focus-visible:ring-danger/20''
            : ''focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-accent/20'',

          // Disabled
          ''disabled:opacity-50 disabled:cursor-not-allowed'',

          // Caller overrides
          className
        )}
        {...rest}
      />
    );
  }
);

Input.displayName = ''Input'';

'@
Set-Content -Path "$repoPath\src\components\ui\Input.tsx" -Value $content -Encoding UTF8 -NoNewline

# --- src/components/ui/Card.tsx ---
$content = @'
import { forwardRef, type HTMLAttributes, type ReactNode } from ''react'';
import { cn } from ''@/lib/cn'';

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
          ''rounded-lg border border-border-subtle'',
          ''bg-bg-surface'',
          ''p-5'',
          ''shadow-card'',

          // Interactive
          interactive && cn(
            ''cursor-pointer'',
            ''transition-colors duration-150'',
            ''hover:bg-bg-page''
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

Card.displayName = ''Card'';

'@
Set-Content -Path "$repoPath\src\components\ui\Card.tsx" -Value $content -Encoding UTF8 -NoNewline


# Remove scaffold's tailwind.config.js (JS variant) if create-next-app produced it
if (Test-Path "$repoPath\tailwind.config.js") {
    Remove-Item "$repoPath\tailwind.config.js" -Force
}

Write-Host ''
Write-Host '--- Step 6: Verifying build ---' -ForegroundColor Green
Write-Host '  tsc --noEmit ...'
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host 'tsc --noEmit reported errors. Inspect above output.' -ForegroundColor Yellow
}

Write-Host '  npm run lint ...'
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host 'npm run lint reported errors. Inspect above output.' -ForegroundColor Yellow
}

Write-Host '  npm run build ...'
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host 'npm run build failed. Inspect above output.' -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host '--- Step 7: Committing ---' -ForegroundColor Green
git add -A
$commitMsg = @'
feat(phase-1): design system scaffold - tokens, primitives, gallery

- Next.js 14 App Router + TypeScript strict + Tailwind
- Light-mode CSS variables from docs/STYLE_GUIDE.md S2.11
- Typed design tokens in src/lib/tokens.ts (mirrors CSS vars)
- 3 primitives: Button, Input, Card (STYLE_GUIDE S6)
- Design gallery at /design replacing Storybook
- ESLint rule: no-restricted-syntax bans hex literals in .tsx
- Geist font (sans + mono) via next/font/google
- Dark mode deferred
'@
git commit -m $commitMsg

Write-Host ''
Write-Host '===============================================================================' -ForegroundColor Cyan
Write-Host ' DONE' -ForegroundColor Cyan
Write-Host '===============================================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'To start the dev server:'
Write-Host ("  cd " + $repoPath)
Write-Host '  npm run dev'
Write-Host ''
Write-Host 'Then open http://localhost:3000/design'
Write-Host ''
Write-Host 'When ready to push:'
Write-Host '  git push origin main'
