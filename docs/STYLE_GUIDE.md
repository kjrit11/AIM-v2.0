# AIM v2 — Style Guide

**Aesthetic target:** CareInMotion brand applied with Linear/Vercel-grade restraint. Branded, dense, dark-first.
**Owner:** Kevin Ritter, CareInMotion
**Color source:** CareInMotion Brand & Document Style Guide v1.1 (March 2026)
**Last updated:** 2026-04-18 (color palette swapped to CareInMotion brand; aesthetic principles preserved)

This is the single source of truth for visual design. Every component, page, and token references this file. If you find yourself inventing a color, spacing value, or pattern not in this document — stop.

---

## 1. Design principles

1. **Restraint over decoration.** Color is information, not decoration. An indigo gradient is wrong. A Navy background with a Coral CTA is right.
2. **Information density, handled with whitespace.** Sales tools are dense. Handle density with generous vertical rhythm and clear visual hierarchy, not by shrinking text.
3. **One accent per screen.** The accent is Periwinkle in light mode, Coral in dark mode. Never two competing accents in the same view.
4. **Dark is default; light is first-class.** The app opens in dark mode for internal users at desks. But external sales demos happen on bright projectors — light mode must look good, not merely work. Both modes are designed, both are reviewed, both ship.
5. **Motion is purposeful.** Fade and subtle slide only. No bounces, no spring physics, no stagger.
6. **Mono typography signals data.** Numbers, IDs, timestamps, currency in mono. Everything else sans.

---

## 2. Color tokens

All colors come from the CareInMotion brand palette. No invention, no variant-on-a-variant, no "a little darker than Periwinkle."

### 2.1 Brand

```typescript
export const brand = {
  navy:       '#151744',  // the brand itself — primary dark surface + brand accent
  periwinkle: '#707CF2',  // light-mode accent, focus rings, links
  purple:     '#383392',  // secondary brand surface, hover state on accent
  coral:      '#F56E7B',  // dark-mode accent, critical alerts, attention
};
```

### 2.2 Accent (mode-specific)

The accent differs by mode — this is a deliberate brand choice.

| Mode | Accent | Accent hover | Accent active |
|---|---|---|---|
| Light | Periwinkle `#707CF2` | Purple `#383392` | Purple `#383392` + inner shadow |
| Dark | Coral `#F56E7B` | Coral darkened 8% | Coral darkened 12% + inner shadow |

**Rule:** the accent is the only color for primary CTAs, focus rings, selected states, links. Wherever you'd reach for "brand blue" in a generic dashboard, use the accent for the current mode.

### 2.3 Neutrals

The CareInMotion palette doesn't name a full neutral scale, but these are the required greys for text, borders, and muted surfaces.

```typescript
export const neutral = {
  // Dark-mode text
  white:      '#FFFFFF',
  ruleGray:   '#DDDDE8',
  muted:      '#6B6B9A',

  // Light-mode text
  nearBlack:  '#1C1C38',

  // Light-mode surfaces
  offWhite:   '#F6F6FB',
  paperWhite: '#FFFFFF',
};
```

### 2.4 Status (semantic, never decorative)

```typescript
export const status = {
  success: { fg: '#10B981', bg: 'rgba(16,185,129,0.10)',  border: '#10B981' }, // Emerald
  warning: { fg: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: '#F59E0B' }, // Amber
  danger:  { fg: '#F56E7B', bg: 'rgba(245,110,123,0.12)', border: '#F56E7B' }, // Coral
  info:    { fg: '#3B82F6', bg: 'rgba(59,130,246,0.10)',  border: '#3B82F6' }, // Indigo-blue, tuned to not fight Periwinkle
};
```

**Rule:** only use for status. A "success" badge next to a completed task is right. A green button just because green looks nice is wrong.

### 2.5 Category tokens (mode-aware)

Notes and some task badges use category color. The **left edge bar** carries the brand color; **badges** and **text accents** use muted tints. This keeps categories readable without overloading the page with brand color.

```typescript
export const category = {
  client: {
    light: { bar: '#10B981', badge: 'rgba(16,185,129,0.08)',  fg: '#0F766E' },   // Emerald
    dark:  { bar: '#10B981', badge: 'rgba(16,185,129,0.14)',  fg: '#6EE7B7' },   // Same Emerald, lighter text
  },
  sales: {
    light: { bar: '#383392', badge: 'rgba(56,51,146,0.08)',   fg: '#383392' },   // Purple (not Periwinkle — avoids accent conflict)
    dark:  { bar: '#707CF2', badge: 'rgba(112,124,242,0.14)', fg: '#A5B0F6' },   // Periwinkle on dark for contrast
  },
  prospect: {
    light: { bar: '#F56E7B', badge: 'rgba(245,110,123,0.08)', fg: '#B03040' },   // Coral
    dark:  { bar: '#F56E7B', badge: 'rgba(245,110,123,0.14)', fg: '#FDA4AF' },   // Same Coral, lighter text
  },
  internal: {
    light: { bar: '#6B6B9A', badge: 'rgba(107,107,154,0.08)', fg: '#52525B' },   // Muted gray — reads as "not branded"
    dark:  { bar: '#DDDDE8', badge: 'rgba(221,221,232,0.10)', fg: '#DDDDE8' },   // Rule Gray — visible on Navy
  },
};
```

**Notes:**
- **Sales = Purple in light mode, Periwinkle in dark.** This avoids having Sales-category content collide with the light-mode accent (which is also Periwinkle).
- **Internal = Muted gray in light, Rule Gray in dark.** Navy on Navy would be invisible — Rule Gray reads as "neutral, un-branded" on dark surfaces.
- All other category tokens stay consistent across modes.

### 2.6 Surfaces

```typescript
export const surface = {
  light: {
    page:    '#F6F6FB',  // --bg-page
    panel:   '#F6F6FB',  // --bg-panel (same as page for minimalism)
    card:    '#FFFFFF',  // --bg-surface (cards sit above panels)
  },
  dark: {
    root:    '#151744',  // --color-background / --color-card — Navy IS the app root
    card:    '#151744',  // cards inherit root; distinguished by border only
    elevated:'#383392',  // Purple for modals, popovers, elevated surfaces
    muted:   '#383392',  // --color-muted
  },
};
```

**Key decision:** dark mode app root is Navy `#151744`, per the CareInMotion brand guide. Cards are the same Navy but distinguished by a 1px border. Elevated surfaces (modals, popovers) step up to Purple `#383392` to create layering.

### 2.7 Text tokens

```typescript
export const text = {
  light: {
    primary:    '#1C1C38',  // body text, primary headings
    secondary:  '#151744',  // section headings, labels
    tertiary:   '#6B6B9A',  // captions, metadata, muted
    quaternary: '#DDDDE8',  // disabled, placeholder
  },
  dark: {
    primary:    '#FFFFFF',  // body text on Navy
    secondary:  '#707CF2',  // section headings (Periwinkle reads well on Navy)
    tertiary:   '#DDDDE8',  // captions, metadata
    quaternary: '#6B6B9A',  // disabled, placeholder
  },
};
```

**Rule:** never use near-white for body text in light mode; never use raw `#333` or random greys. The 4-tier hierarchy is exhaustive.

### 2.8 Borders and dividers

```typescript
export const border = {
  light: {
    primary:  '#707CF2',                      // strong borders — input focus, active selection
    subtle:   '#DDDDE8',                      // default dividers, card borders
    hairline: 'rgba(21, 23, 68, 0.08)',       // subtle 1px separators
  },
  dark: {
    primary:   '#707CF2',                     // Periwinkle for strong borders
    secondary: '#383392',                     // Purple for default dividers
    tertiary:  '#6B6B9A',                     // muted dividers
  },
};
```

All borders are **1px**. Never 2px. Never dashed unless explicitly calling attention to something unusual (rare).

### 2.9 Alpha tints (for hover halos, focus glows, badge backgrounds)

```typescript
export const tint = {
  brand:         'rgba(21, 23, 68, 0.10)',       // Navy tint
  accent:        'rgba(112, 124, 242, 0.10)',    // Periwinkle tint (light mode)
  accentDark:    'rgba(245, 110, 123, 0.14)',    // Coral tint (dark mode)
  emerald:       'rgba(16, 185, 129, 0.10)',     // Success tint
  coralSubtle:   'rgba(245, 110, 123, 0.12)',    // Coral wash
  coralFocus:    'rgba(245, 110, 123, 0.45)',    // Coral focus ring
  whiteWashLow:  'rgba(255, 255, 255, 0.04)',    // Hover on dark
  whiteWashMid:  'rgba(255, 255, 255, 0.08)',    // Active on dark
  whiteWashHigh: 'rgba(255, 255, 255, 0.14)',    // Pressed on dark
  placeholder:   'rgba(255, 255, 255, 0.30)',    // Input placeholder on dark
};
```

### 2.10 Shadows

Whisper-quiet. If a shadow is visible from across the room, it's wrong.

```typescript
export const shadow = {
  ring:     'rgba(21, 23, 68, 0.08) 0px 0px 0px 1px',
  subtle:   'rgba(21, 23, 68, 0.04) 0px 2px 4px 0px',
  card:     'rgba(21, 23, 68, 0.08) 0px 0px 0px 1px, rgba(21, 23, 68, 0.04) 0px 2px 4px 0px',
  elevated: 'rgba(21, 23, 68, 0.08) 0px 0px 0px 1px, rgba(21, 23, 68, 0.06) 0px 4px 12px 0px',
  inner:    'inset 0 1px 2px 0 rgb(0 0 0 / 0.10)',  // pressed states
};
```

In dark mode, shadows are almost invisible against Navy. Use `shadow.ring` (the 1px border-like shadow) instead.

### 2.11 CSS variables — Light mode

```css
:root {
  /* Surfaces */
  --bg-page:     #F6F6FB;
  --bg-panel:    #F6F6FB;
  --bg-surface:  #FFFFFF;

  /* Text */
  --text-primary:    #1C1C38;
  --text-secondary:  #151744;
  --text-tertiary:   #6B6B9A;
  --text-quaternary: #DDDDE8;

  /* Brand + accent */
  --brand:         #151744;
  --accent:        #707CF2;
  --accent-hover:  #383392;
  --accent-active: #383392;

  /* Status */
  --success: #10B981;
  --warning: #F59E0B;
  --danger:  #F56E7B;
  --info:    #3B82F6;

  /* Borders */
  --border-primary:  #707CF2;
  --border-subtle:   #DDDDE8;
  --border-hairline: rgba(21, 23, 68, 0.08);

  /* Shadows */
  --shadow-ring:     rgba(21, 23, 68, 0.08) 0px 0px 0px 1px;
  --shadow-subtle:   rgba(21, 23, 68, 0.04) 0px 2px 4px 0px;
  --shadow-card:     var(--shadow-ring), var(--shadow-subtle);
  --shadow-elevated: var(--shadow-ring), rgba(21, 23, 68, 0.06) 0px 4px 12px 0px;
}
```

### 2.12 CSS variables — Dark mode

```css
[data-theme="dark"] {
  /* Surfaces */
  --bg-page:    #151744;   /* Navy root — the app */
  --bg-panel:   #151744;
  --bg-surface: #151744;   /* Cards same as root, distinguished by border */
  --bg-elevated:#383392;   /* Modals, popovers, elevated panels — Purple */

  /* Text */
  --text-primary:    #FFFFFF;
  --text-secondary:  #707CF2;
  --text-tertiary:   #DDDDE8;
  --text-quaternary: #6B6B9A;

  /* Brand + accent (note: accent flips to Coral on dark) */
  --brand:         #151744;
  --accent:        #F56E7B;   /* Coral — the dark-mode primary CTA */
  --accent-hover:  #F0626F;   /* Coral -8% lightness */
  --accent-active: #E75460;   /* Coral -12% lightness */

  /* Status (same semantic fg; backgrounds adjusted for contrast) */
  --success: #10B981;
  --warning: #F59E0B;
  --danger:  #F56E7B;
  --info:    #60A5FA;         /* lighter info blue on dark */

  /* Borders */
  --border-primary:   #707CF2;   /* Periwinkle strong borders */
  --border-secondary: #383392;   /* Purple default dividers */
  --border-subtle:    #383392;

  /* Shadows are minimal on dark; use ring borders instead */
  --shadow-ring:     rgba(255, 255, 255, 0.06) 0px 0px 0px 1px;
  --shadow-subtle:   none;
  --shadow-card:     var(--shadow-ring);
  --shadow-elevated: var(--shadow-ring), rgba(0, 0, 0, 0.32) 0px 8px 24px 0px;
}
```

---

## 3. Typography

### 3.1 Font stack

```typescript
export const fonts = {
  sans: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  mono: '"Geist Mono", "JetBrains Mono", "Fira Code", Consolas, monospace',
};
```

One family. Geist first, Inter fallback. The old Montserrat / Open Sans / JetBrains Mono mixed stack is gone.

### 3.2 Scale

```typescript
export const type = {
  // Display (rare — only empty states or marketing surfaces, of which we have none today)
  'display-lg': { size: '48px', lineHeight: '56px', weight: 600, tracking: '-0.02em' },

  // Page titles
  'h1': { size: '28px', lineHeight: '36px', weight: 600, tracking: '-0.01em' },
  'h2': { size: '22px', lineHeight: '30px', weight: 600, tracking: '-0.01em' },
  'h3': { size: '18px', lineHeight: '26px', weight: 600, tracking: '0'      },
  'h4': { size: '15px', lineHeight: '22px', weight: 600, tracking: '0'      },

  // Body
  'body-lg': { size: '16px', lineHeight: '24px', weight: 400 },
  'body':    { size: '14px', lineHeight: '20px', weight: 400 },  // default body
  'body-sm': { size: '13px', lineHeight: '18px', weight: 400 },
  'caption': { size: '12px', lineHeight: '16px', weight: 400 },

  // Mono (data)
  'mono':    { size: '13px', lineHeight: '18px', weight: 400, family: 'mono' },
  'mono-sm': { size: '12px', lineHeight: '16px', weight: 400, family: 'mono' },

  // Micro (labels, eyebrows — use sparingly)
  'eyebrow': { size: '11px', lineHeight: '14px', weight: 500, tracking: '0.06em', transform: 'uppercase' },
};
```

### 3.3 Usage rules

- Page titles are `h1` — one per page.
- Section headers are `h3` — never skip from `h1` to `h4`.
- Body copy is `body` (14px) — not 16px. Sales tools benefit from tighter text.
- Numbers in tables, pricing, IDs, timestamps, currency: `mono` family.
- Eyebrow labels (e.g., "PIPELINE") are `eyebrow` with uppercase — use sparingly. Not every section header wants an eyebrow.

---

## 4. Spacing

```typescript
export const space = {
  0:  '0',
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  8:  '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
};
```

4px base. Never `13px`, never `17px`, never `21px`.

### Layout rules

- Page content max-width: `1280px`. Center with `mx-auto`.
- Page padding: `space.6` (24px) horizontal, `space.8` (32px) top/bottom.
- Card internal padding: `space.5` (20px).
- Vertical rhythm between sections: `space.10` (40px).
- Between form fields: `space.4` (16px).

---

## 5. Borders, radius, shadows

```typescript
export const radius = {
  none: '0',
  sm:   '4px',   // badges, tags
  md:   '6px',   // inputs, buttons
  lg:   '8px',   // cards
  xl:   '12px',  // modals, large panels
  full: '9999px',
};

export const borderWidth = {
  width: '1px',  // only ever 1px
};
```

All borders use `var(--border-subtle)` or `var(--border-primary)` from §2. Never hardcode a border color.

Shadows are defined in §2.10. Use `shadow.card` for default cards, `shadow.elevated` for modals, `shadow.ring` for subtle definition especially on dark mode.

---

## 6. Component specs

### 6.1 Button

```
Size       Height    Padding-X    Font         Radius
sm         28px      12px         body-sm      md
md         36px      16px         body         md   ← default
lg         44px      20px         body-lg      md

Variants:
primary    --accent bg, white text, no border
secondary  var(--bg-surface) bg, --text-primary, 1px var(--border-subtle) border
ghost      transparent, --text-primary, no border, var(--tint.whiteWashLow) bg on hover
danger     --danger bg, white text

Hover:     -4% lightness on bg (or use --accent-hover for primary)
Active:    -8% lightness + shadow.inner (or --accent-active for primary)
Focus:     2px --accent ring, 2px offset
Disabled:  50% opacity, no hover state
```

Primary button is Periwinkle on light, Coral on dark — the `--accent` CSS variable handles this automatically.

### 6.2 Input / Textarea

```
Height:      36px (input), auto (textarea)
Padding:     space.3 (12px)
Border:      1px solid var(--border-subtle)
Radius:      md (6px)
Background:  var(--bg-surface)
Font:        body
Placeholder: --text-quaternary

Focus:
  border: 1px solid var(--accent)
  ring:   3px var(--accent) at 20% opacity (3px outer glow)

Error:
  border:      1px solid var(--danger)
  helper text: var(--danger), body-sm
```

### 6.3 Card

```
Background: var(--bg-surface)
Border:     1px solid var(--border-subtle)
Radius:     lg (8px)
Padding:    space.5 (20px)
Shadow:     var(--shadow-card) — subtle 1px ring + light shadow on light mode; just ring on dark

NO gradient backgrounds.
NO shadow heavier than card by default.
```

Interactive cards (hover states): subtle background tint (`--tint.whiteWashLow` on dark, `--tint.brand` at 4% on light). No border color change.

### 6.4 Dialog

```
Background: var(--bg-elevated)        [dark mode: Purple; light mode: surface]
Border:     1px solid var(--border-subtle)
Radius:     xl (12px)
Padding:    space.6 (24px)
Close btn:  top-right, 32x32, ghost variant
Shadow:     var(--shadow-elevated)
Animation:  fade 150ms + subtle scale 0.98 → 1.0
Backdrop:   rgba(21, 23, 68, 0.60) on light; rgba(0, 0, 0, 0.60) on dark
```

### 6.5 Sidebar

```
Width:      240px (desktop); collapses to 64px with icons only
Background: var(--bg-panel)
Border:     1px solid var(--border-subtle) on right edge
Padding:    space.4 top/bottom, space.2 horizontal

Nav item:
  Height:   36px
  Padding:  space.3 horizontal
  Radius:   md
  Color:    var(--text-tertiary)
  Icon:     16px, stroke 1.5
  Gap:      space.3 between icon and label

Active:
  bg:       var(--tint.whiteWashMid) on dark; var(--tint.brand) on light
  color:    var(--text-primary)
  NO left accent bar, NO colored background beyond the subtle tint.

Hover (inactive):
  bg: var(--tint.whiteWashLow) on dark; var(--border-hairline) on light
```

Sidebar is intentionally restrained — no colorful active indicators. The subtle bg tint is enough.

### 6.6 Badge

```
Height:   20px
Padding:  0 space.2 (8px)
Radius:   sm (4px)
Font:     caption (12px), weight 500
Tracking: 0.02em

Variants:
neutral    var(--tint.brand) bg, --text-secondary
accent     var(--tint.accent) bg, --accent fg
success    var(--tint.emerald) bg, var(--success) fg
warning    var(--status.warning.bg) bg, var(--warning) fg
danger     var(--tint.coralSubtle) bg, var(--danger) fg
info       var(--status.info.bg) bg, var(--info) fg
```

Category badges (Client / Sales / Prospect / Internal) use the `category` tokens from §2.5, with the mode-aware mapping.

### 6.7 Category bar (new — specific to note cards, task rows)

A 3px-wide vertical strip on the left edge of a card or row, indicating category.

```
Width:      3px
Height:     100% of card/row
Color:      category[mode].bar (see §2.5)
Position:   absolute left edge, flush with radius
```

On a note card, the rest of the card uses the default `--bg-surface`. The bar is the only category indicator at the card level; a matching-color badge reinforces it in the metadata row but is not required.

---

## 7. Iconography

- **Library:** `lucide-react`. One library, no exceptions.
- **Stroke width:** 1.5 (not the default 2 — softer)
- **Sizes:** 14, 16, 20, 24. No others.
- **Color:** inherit from parent text color. Icons are not decorative accents.

On dark mode, icons sit on Navy — stroke 1.5 keeps them legible without competing with text.

---

## 8. Page layouts

### 8.1 Standard page shell

```
┌─────────────────────────────────────────────────┐
│ TopBar (56px)                                   │
├────────┬────────────────────────────────────────┤
│        │ PageHeader (space.6 padding)           │
│ Side   │ ┌────────────────────────────────────┐ │
│ bar    │ │ h1 title          [actions → →]   │ │
│ 240px  │ │ body-sm description                │ │
│        │ └────────────────────────────────────┘ │
│        │                                        │
│        │ Main content (max-w-1280, centered)   │
│        │                                        │
└────────┴────────────────────────────────────────┘
```

### 8.2 Overview page (minimalist)

```
PageHeader: "Overview" + small "Last 30 days" chip

Row 1: 4 KPI tiles (equal width)
        ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Pipeline │ │ Closed   │ │ Quota %  │ │ Avg deal │
        │ $2.4M    │ │ $840K    │ │ 68%      │ │ $127K    │
        │ ↗ +12%   │ │ ↗ +4%    │ │ → 0%     │ │ ↘ -3%    │
        └──────────┘ └──────────┘ └──────────┘ └──────────┘

Row 2: One chart — pipeline horizontal bar or funnel.
        Minimal chart chrome. No legend unless multi-series.
        Y-axis labels in mono-sm.

Row 3: "Recent activity" — 5-10 rows, scrollable.
        Opportunity name, owner avatar, stage, amount, updated.
        No cards. Table rows. Minimal.

NO daily quote banner.
NO region cards.
NO 6-row layout.
Empty is the point.
```

### 8.3 Pricing Agent layout

```
Left panel (40%):  inputs (segment, volume, discount, modules)
Right panel (60%): live quote preview
  - Total + monthly breakdown (mono, large)
  - Line items (table, 36px rows)
  - COGS bars (thin, 8px height)
  - Margin floor indicator
  - Approval zone badge
```

### 8.4 Proposal builder layout

```
Top:           breadcrumb (Opportunities / Acme Health / New Proposal)
Left (30%):    outline/sections navigation
Center (50%):  live HTML preview
Right (20%):   inspector — edit current section
Bottom bar:    Save draft | Export PDF | Send email
```

### 8.5 Notes & Tasks layout

Covered in detail in `docs/modules/NOTES_AND_TASKS.md`. Summary:

- Single left-rail entry "Notes & Tasks"
- Top-bar tabs: Tasks | Notes
- Tasks tab: urgency-grouped list with filters
- Notes tab: date-grouped cards with category bar
- Detail: 40% slide-over, min 560px
- New note: full-page route

---

## 9. Motion

```typescript
export const motion = {
  // Durations
  fast:   '100ms',
  base:   '150ms',
  slow:   '250ms',

  // Easings
  out:    'cubic-bezier(0.22, 1, 0.36, 1)',     // default — ease-out
  inOut:  'cubic-bezier(0.65, 0, 0.35, 1)',     // dialogs, drawers
  in:     'cubic-bezier(0.5, 0, 0.75, 0)',      // rare — leaving states
};
```

### Rules

- Hover transitions: `150ms ease-out` on color/background.
- Dialogs: fade 150ms + scale 0.98 → 1.0.
- Slide-overs: slide from right, 250ms ease-inOut.
- Page transitions: none. Don't animate route changes.
- Skeleton loaders: 1.2s pulse, infinite.
- No stagger. No spring physics. No bounces.

If motion is noticeable, it's wrong. It should feel instant.

---

## 10. Charts (recharts config)

### Defaults — apply globally

```typescript
export const chartDefaults = {
  colors: [
    '#707CF2',  // Periwinkle (primary series)
    '#6B6B9A',  // Muted (secondary)
    '#10B981',  // Emerald (tertiary)
    '#F56E7B',  // Coral (quaternary — status-like)
  ],
  grid: {
    stroke: 'var(--border-subtle)',
    strokeDasharray: '0',  // solid, not dashed
  },
  axis: {
    stroke: 'var(--text-tertiary)',
    fontSize: 12,
    fontFamily: fonts.mono,
  },
  tooltip: {
    background:   'var(--bg-elevated)',
    border:       '1px solid var(--border-subtle)',
    borderRadius: radius.md,
    fontSize:     13,
  },
};
```

### Rules

- Never more than 4 series in one chart.
- No 3D, no pie charts (use donut max, and only when comparing 2–4 categories).
- Bar charts: horizontal preferred for ranked data, vertical for time series.
- Line charts: 1.5px stroke, no gradients, no shadows.
- Lazy-load every chart (`next/dynamic` with `ssr: false`).

---

## 11. Empty states

Every list view has a designed empty state. Never an empty page.

```
┌─────────────────────────────────────┐
│                                     │
│            [16x16 icon]             │
│                                     │
│         h3: "No opportunities"      │
│                                     │
│   body-sm tertiary: "Create your    │
│   first opportunity to start        │
│   tracking deals."                  │
│                                     │
│       [Primary button: "New"]       │
│                                     │
└─────────────────────────────────────┘
```

Illustration is optional — typographic empty states are fine and often cleaner than custom art.

---

## 12. Theme toggle

- **Default: dark.** The app opens in dark mode for every new user. No flash of light content on load.
- Toggle lives in the top bar, next to the user avatar.
- `prefers-color-scheme` is **ignored** on first load — we default to dark regardless of OS.
- User selection persists in `localStorage` under `aim:theme`. Once a user chooses light, respect it.
- Initial HTML has `data-theme="dark"` server-side to prevent flash.
- Before every external demo, verify the demo will happen in light mode (better on projectors). This is a checklist item, not a technical change.

---

## 13. Accessibility floor

- Every interactive element: 2px focus ring, 2px offset, `var(--accent)` color.
- Every icon button: `aria-label`.
- Color contrast: 4.5:1 for body text, 3:1 for large text. Verify with a checker — especially on dark mode where Navy + Periwinkle approaches the limit for small text.
- Never use color alone to convey status — pair with icon or text.
- Keyboard: tab order follows visual order; dialogs trap focus; `Esc` closes modals.

---

## 14. What NOT to do

- ❌ No gradients anywhere. Even in hero surfaces.
- ❌ No drop shadows heavier than `shadow.elevated`.
- ❌ No text-shadows.
- ❌ No custom scrollbars.
- ❌ No animated loading spinners — use skeletons.
- ❌ No emoji in UI chrome. Emoji in user-authored content is fine.
- ❌ No multi-colored category navigation. Nav is neutral; category lives on cards via the 3px bar.
- ❌ No font weights other than 400 / 500 / 600. No 300, no 700, no 800.
- ❌ No letter-spacing on body text.
- ❌ No fully-rounded buttons except FABs (and we don't use FABs).
- ❌ No hex values in components. Tokens only. ESLint blocks this.

---

## 15. Reference points

When in doubt, look at:

- **Linear** (linear.app) — sidebar density, list rendering, keyboard navigation
- **Vercel dashboard** (vercel.com/dashboard) — project cards, deployments table
- **Stripe dashboard** (dashboard.stripe.com) — payments table, data density
- **Resend** (resend.com) — clean auth flows, empty states

Avoid:
- Salesforce Lightning (too much chrome)
- HubSpot (too warm/friendly for this tool)
- Anything with CoPilot in the title

---

## 16. CareInMotion document style (for exports, not UI)

This style guide covers the **in-app UI**. Exported documents — proposals (Phase 6), agendas and meeting notes (Phase 8.5) — follow a separate document style.

Reference files:
- `CareIntelligence_Template_MeetingAgenda_2026-04-18.docx`
- `CareIntelligence_Template_MeetingNotes_2026-04-18.docx`

Both supplied by Kevin on 2026-04-18. They establish the formal third-person tone, table layouts, status color semantics (Critical/Watch/Monitoring for risks; Complete/In Progress/Blocked/Not Started for actions), and branded header/footer for CareInMotion client-facing documents.

A full `docs/DOCUMENT_STYLE.md` will be created before Phase 6 (Proposals) ships.

---

## 17. Final rule

When building any new screen, the question is not "what can I add?" — it's "what can I remove?"

Minimalism is an active practice. Every pixel earns its place.
