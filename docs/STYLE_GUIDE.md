# AIM v2 — Style Guide

**Aesthetic target:** Linear/Vercel-grade dark indigo. Near-black surfaces, indigo accent used sparingly for primary actions, greyscale for everything else. Data uses paired semantic foreground/background pairs.
**Owner:** Kevin Ritter, CareInMotion
**Last updated:** 2026-04-19 (Phase 2 pivot — CareInMotion periwinkle/coral palette replaced by dark indigo system; light mode deferred)

This is the single source of truth for visual design. Every component, page, and token references this file. If you find yourself inventing a color, spacing value, or pattern not in this document — stop.

---

## 1. Design principles

1. **Restraint over decoration.** Color is information, not decoration. An indigo gradient is wrong. A near-black surface with an indigo primary CTA is right.
2. **Information density, handled with whitespace.** Sales tools are dense. Handle density with generous vertical rhythm and clear visual hierarchy, not by shrinking text.
3. **One accent per screen.** Indigo `#6366F1` is the only accent. It is reserved for primary actions, focus rings, selected states, and brand moments. Never used to encode data — semantic tokens do that.
4. **Dark-only at Phase 2.** Light mode is deferred (see §2 and `docs/DEFERRED.md`). The token system was rebuilt dark-first so a future light mode re-inverts these values rather than layering on top.
5. **Motion is purposeful.** Fade and subtle slide only. No bounces, no spring physics, no stagger.
6. **Mono typography signals data.** Numbers, IDs, timestamps, currency in mono. Everything else sans.

---

## 2. Color tokens

Dark-first, near-black neutrals, single indigo accent, paired semantic fg/bg for data. **Light mode is explicitly deferred** — see `docs/DEFERRED.md`. Revisit conditions: (a) external demo UX demands a projector-friendly mode, (b) accessibility review flags dark-only as a blocker, or (c) v2.1 scope reopens for theming. Until one of those lands, no `prefers-color-scheme: light` rules, no `.light` class, no inverted palette shim.

### 2.1 Neutrals (9 stops — named by role, not number)

The neutral scale is what the app looks like 90% of the time. Every token is named by role so code reads like the design, not like `zinc-900`.

| Token              | Hex      | Purpose                                     |
|--------------------|----------|---------------------------------------------|
| `bg-page`          | `#08080B` | Page background (app root)                 |
| `bg-sidebar`       | `#0B0B0F` | Sidebar, topbar                            |
| `bg-surface`       | `#101014` | Cards, inputs, table rows                  |
| `bg-surface-hover` | `#18181B` | Hover states, active nav                   |
| `border-subtle`    | `#1C1C21` | Default borders, dividers                  |
| `border-strong`    | `#27272A` | Input focus, emphasis                      |
| `text-muted`       | `#52525B` | Labels, section headers                    |
| `text-secondary`   | `#71717A` | Timestamps, metadata                       |
| `text-body`        | `#A1A1AA` | Body copy, inactive nav                    |
| `text-strong`      | `#D4D4D8` | Table values, data                         |
| `text-primary`     | `#FAFAFA` | Headings, active items                     |

**Rule:** never hand-mix a shade between two stops. If two greys feel wrong next to each other, pick a different pair from the scale — don't invent a 12th stop.

### 2.2 Accent — indigo

Reserved for primary actions and brand moments only. **Never used to encode data** (use semantic tokens for that).

| Token           | Hex      | Purpose                              |
|-----------------|----------|--------------------------------------|
| `accent`        | `#6366F1` | Primary buttons                     |
| `accent-hover`  | `#818CF8` | Hover state, focus rings, links     |
| `accent-subtle` | `#1E1B4B` | Badge backgrounds, subtle fills     |

**Rule:** the accent is the single brand color. A screen with two indigo regions is a screen with no accent.

### 2.3 Semantic (paired foreground/background — always used together)

Semantic tokens ship as fg/bg pairs. The fg is the text/icon color, the bg is a low-saturation dark wash. Always paired — a bare fg on `bg-surface` reads as raw color; a bare bg with default text reads as broken. Use the pair.

| Token     | fg        | bg        | Purpose                                              |
|-----------|-----------|-----------|------------------------------------------------------|
| `success` | `#4ADE80` | `#0F2419` | High win prob, healthy deals, closed-won             |
| `warning` | `#FB923C` | `#2A1810` | Stalled deals, medium signal, margin alerts         |
| `danger`  | `#F87171` | `#2A0F12` | At-risk deals, high signal intel, closed-lost       |
| `info`    | `#60A5FA` | `#0C1F2E` | Neutral tags, in-progress, system messages          |

**Rule:** status tokens never replace the accent. A "Closed-won" badge is success green, a "Submit proposal" button is indigo — not green, not warmer green, not the same green.

### 2.4 What got dropped

The CareInMotion periwinkle/coral/navy palette is out. `brand.navy`, `brand.periwinkle`, `brand.purple`, `brand.coral` are no longer tokens. The mode-aware accent (Periwinkle light → Coral dark) is out — single indigo accent in its place. The category tokens (Client/Sales/Prospect/Internal) are deferred until a concrete Notes/Tasks visual design lands in Phase 8; when they return, they'll be re-expressed in this new palette.

### 2.5 Shadows

Whisper-quiet. If a shadow is visible from across the room, it's wrong. On near-black, shadows mostly read as a 1px border.

```css
--shadow-ring:     rgba(255, 255, 255, 0.04) 0px 0px 0px 1px;
--shadow-subtle:   rgba(0, 0, 0, 0.32) 0px 2px 4px 0px;
--shadow-card:     var(--shadow-ring);
--shadow-elevated: var(--shadow-ring), rgba(0, 0, 0, 0.48) 0px 8px 24px 0px;
--shadow-inner:    inset 0 1px 2px 0 rgba(0, 0, 0, 0.40);
```

Use `shadow-card` for default cards, `shadow-elevated` for modals, `shadow-ring` for hairline definition.

### 2.11 CSS variables — Dark (current)

Paste exactly into `src/app/globals.css`. This block is the runtime source of truth; `src/lib/tokens.ts` mirrors it for TypeScript autocomplete but does not drive styles.

```css
:root {
  /* Neutrals */
  --bg-page:           #08080B;
  --bg-sidebar:        #0B0B0F;
  --bg-surface:        #101014;
  --bg-surface-hover:  #18181B;
  --border-subtle:     #1C1C21;
  --border-strong:     #27272A;
  --text-muted:        #52525B;
  --text-secondary:    #71717A;
  --text-body:         #A1A1AA;
  --text-strong:       #D4D4D8;
  --text-primary:      #FAFAFA;

  /* Accent */
  --accent:            #6366F1;
  --accent-hover:      #818CF8;
  --accent-subtle:     #1E1B4B;

  /* Semantic — foreground */
  --success-fg:        #4ADE80;
  --warning-fg:        #FB923C;
  --danger-fg:         #F87171;
  --info-fg:           #60A5FA;

  /* Semantic — background */
  --success-bg:        #0F2419;
  --warning-bg:        #2A1810;
  --danger-bg:         #2A0F12;
  --info-bg:           #0C1F2E;

  /* Typography */
  --font-sans:         'Inter', -apple-system, system-ui, sans-serif;
  --font-mono:         'JetBrains Mono', 'SF Mono', Menlo, monospace;

  /* Scale */
  --text-micro:        11px;
  --text-caption:      12px;
  --text-body-size:    14px;
  --text-section:      16px;
  --text-page:         20px;
  --line-height-body:  1.5;

  /* Shadows */
  --shadow-ring:       rgba(255, 255, 255, 0.04) 0px 0px 0px 1px;
  --shadow-subtle:     rgba(0, 0, 0, 0.32) 0px 2px 4px 0px;
  --shadow-card:       var(--shadow-ring);
  --shadow-elevated:   var(--shadow-ring), rgba(0, 0, 0, 0.48) 0px 8px 24px 0px;
}
```

### 2.12 CSS variables — Light mode (deferred)

Light mode is explicitly deferred at Phase 2. Do NOT preserve `@media (prefers-color-scheme: light)` blocks or `.light` class rules in `globals.css`. When light mode returns, it will be re-derived from this dark token set (not restored from the old periwinkle/coral palette).

See `docs/DEFERRED.md` § "Light mode" for revisit conditions.

---

## 3. Typography

### 3.1 Font stack

```typescript
export const fonts = {
  sans: "'Inter', -apple-system, system-ui, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
};
```

Two families, both loaded via `next/font/google` in `src/app/layout.tsx`. Inter handles all UI chrome and content; JetBrains Mono handles data (numbers, IDs, timestamps, currency). The old Geist stack is gone.

### 3.2 Scale

The scale is deliberately smaller than the previous system. Body is 14px (not 13px, which we tried and rejected — too tight for the proposal and intel feed views). Headings step down by weight as much as by size.

```typescript
export const type = {
  // Page titles
  'page-title': { size: '20px', lineHeight: '28px', weight: 500 },    // h1 — one per page
  'section':    { size: '16px', lineHeight: '24px', weight: 500 },    // h2 — section headers

  // Body
  'body':       { size: '14px', lineHeight: '21px', weight: 400 },    // default body (1.5 line-height)
  'caption':    { size: '12px', lineHeight: '16px', weight: 400 },    // small, metadata

  // Micro (labels, eyebrows — use sparingly)
  'micro':      { size: '11px', lineHeight: '14px', weight: 500, tracking: '0.06em', transform: 'uppercase' },

  // Mono (data) — no separate size, inherits from context
  'mono':       { family: 'mono', size: '13px', lineHeight: '18px', weight: 400 },
  'mono-sm':    { family: 'mono', size: '12px', lineHeight: '16px', weight: 400 },
};
```

CSS variable names (also exported in `--text-*`): `--text-micro: 11px`, `--text-caption: 12px`, `--text-body-size: 14px`, `--text-section: 16px`, `--text-page: 20px`. `--line-height-body: 1.5`.

### 3.3 Usage rules

- Page titles are `page-title` (20px / weight 500) — one per page.
- Section headers are `section` (16px / weight 500) — skip levels freely, no forced h1→h3 chain.
- Body copy is `body` (14px) — the explicit choice over 13px. Text-heavy views (proposals, intel feed) need the extra breathing room.
- Numbers in tables, pricing, IDs, timestamps, currency: `mono` family.
- Micro labels (e.g., "PIPELINE") are `micro` (11px, uppercase, 0.06em tracking). Use sparingly; not every section wants an eyebrow.
- Weights in play: 400 (body), 500 (headings + micro). No 600, no 700. This is a deliberate restraint — the palette carries the hierarchy, the weight doesn't need to.

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

All borders use `var(--border-subtle)` or `var(--border-strong)` from §2. Never hardcode a border color.

Shadows are defined in §2.5. Use `shadow-card` for default cards, `shadow-elevated` for modals, `shadow-ring` for hairline definition.

---

## 6. Component specs

### 6.1 Button

```
Size       Height    Padding-X    Font                       Radius
sm         28px      12px         caption (12px / weight 500) md
md         36px      16px         body    (14px / weight 500) md   ← default
lg         44px      20px         body    (14px / weight 500) md

Variants:
primary    --accent bg, --text-primary fg, no border
secondary  var(--bg-surface) bg, var(--text-strong) fg, 1px var(--border-subtle) border
ghost      transparent, var(--text-body) fg, no border, var(--bg-surface-hover) bg on hover
danger     var(--danger-bg) bg, var(--danger-fg) fg, no border

Hover:     var(--bg-surface-hover) for secondary/ghost; --accent-hover for primary
Active:    var(--bg-surface-hover) + shadow-inner for secondary/ghost; --accent primary stays on hover color
Focus:     2px var(--accent-hover) ring, 2px offset (inherited from globals.css)
Disabled:  50% opacity, no hover state
```

Primary button is indigo `#6366F1` — the `--accent` CSS variable.

### 6.2 Input / Textarea

```
Height:      36px (input), auto (textarea)
Padding:     space.3 (12px)
Border:      1px solid var(--border-subtle)
Radius:      md (6px)
Background:  var(--bg-surface)
Font:        14px body, var(--text-primary)
Placeholder: var(--text-muted)

Focus:
  border: 1px solid var(--border-strong)
  ring:   3px var(--accent-hover) at 20% opacity (3px outer glow)

Error:
  border:      1px solid var(--danger-fg)
  helper text: var(--danger-fg), 12px caption
```

### 6.3 Card

```
Background: var(--bg-surface)
Border:     1px solid var(--border-subtle)
Radius:     lg (8px)
Padding:    space.5 (20px)
Shadow:     var(--shadow-card) — hairline ring on near-black

NO gradient backgrounds.
NO shadow heavier than card by default.
```

Interactive cards (hover states): swap bg to `var(--bg-surface-hover)`. No border color change.

### 6.4 Dialog

```
Background: var(--bg-surface)
Border:     1px solid var(--border-subtle)
Radius:     xl (12px)
Padding:    space.6 (24px)
Close btn:  top-right, 32x32, ghost variant
Shadow:     var(--shadow-elevated)
Animation:  fade 150ms + subtle scale 0.98 → 1.0
Backdrop:   rgba(0, 0, 0, 0.60)
```

### 6.5 Sidebar

```
Width:      240px (desktop); collapses to 64px with icons only
Background: var(--bg-sidebar)
Border:     1px solid var(--border-subtle) on right edge
Padding:    space.4 top/bottom, space.2 horizontal

Nav item:
  Height:   36px
  Padding:  space.3 horizontal
  Radius:   md
  Color:    var(--text-body)
  Icon:     16px, stroke 1.5
  Gap:      space.3 between icon and label

Active:
  bg:       var(--bg-surface-hover)
  color:    var(--text-primary)
  NO left accent bar, NO colored background beyond the subtle tint.

Hover (inactive):
  bg: var(--bg-surface-hover) at 60% opacity (or fully-opaque if the elevation is subtle enough)
```

Sidebar is intentionally restrained — no colorful active indicators. The subtle bg tint is enough.

### 6.6 Badge

```
Height:   20px
Padding:  0 space.2 (8px)
Radius:   sm (4px)
Font:     12px caption, weight 500
Tracking: 0.02em

Variants:
neutral    var(--bg-surface-hover) bg, var(--text-body)
accent     var(--accent-subtle) bg, var(--accent-hover) fg
success    var(--success-bg) bg, var(--success-fg) fg
warning    var(--warning-bg) bg, var(--warning-fg) fg
danger     var(--danger-bg) bg, var(--danger-fg) fg
info       var(--info-bg) bg, var(--info-fg) fg
```

Category badges (Client / Sales / Prospect / Internal) are deferred until Phase 8 Notes & Tasks visual design resolves (see §2.4).

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

Icons sit on near-black surfaces — stroke 1.5 keeps them legible without competing with text.

---

## 8. Page layouts

### 8.1 Standard page shell

```
┌─────────────────────────────────────────────────┐
│ TopBar (56px)                                   │
├────────┬────────────────────────────────────────┤
│        │ PageHeader (space.6 padding)           │
│ Side   │ ┌────────────────────────────────────┐ │
│ bar    │ │ page-title        [actions → →]   │ │
│ 240px  │ │ body description                   │ │
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
    'var(--accent)',        // Indigo — primary series
    'var(--text-body)',     // Zinc 400 — secondary
    'var(--success-fg)',    // Green — tertiary (only when data is inherently "good")
    'var(--warning-fg)',    // Amber — quaternary (only when data is inherently "alert")
  ],
  grid: {
    stroke: 'var(--border-subtle)',
    strokeDasharray: '0',  // solid, not dashed
  },
  axis: {
    stroke: 'var(--text-secondary)',
    fontSize: 12,
    fontFamily: "var(--font-mono)",
  },
  tooltip: {
    background:   'var(--bg-surface)',
    border:       '1px solid var(--border-subtle)',
    borderRadius: '6px',
    fontSize:     13,
  },
};
```

**Rule:** the indigo accent is the only brand color in charts. Reach for semantic colors only when the data is inherently good/bad/alert — not as a decorative palette.

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
│    section: "No opportunities"      │
│                                     │
│   body text-body: "Create your      │
│   first opportunity to start        │
│   tracking deals."                  │
│                                     │
│       [Primary button: "New"]       │
│                                     │
└─────────────────────────────────────┘
```

Illustration is optional — typographic empty states are fine and often cleaner than custom art.

---

## 12. Theme toggle — deferred

Light mode is deferred (see §2 and `docs/DEFERRED.md`). No toggle, no `prefers-color-scheme` handling, no `localStorage` persistence at Phase 2. The app is dark-only; when light mode returns, a toggle + persistence lands with it.

---

## 13. Accessibility floor

- Every interactive element: 2px focus ring, 2px offset, `var(--accent)` color.
- Every icon button: `aria-label`.
- Color contrast: 4.5:1 for body text, 3:1 for large text. Verify with a checker — `text-body` (`#A1A1AA`) on `bg-page` (`#08080B`) passes 4.5:1; `text-muted` (`#52525B`) does not and is reserved for large text or labels.
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
