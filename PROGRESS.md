# AIM v2 — Progress

**Last updated:** 2026-04-19 (Phase 2 auth — Entra ID SSO + app shell landing)

---

## Current phase

**Phase 2 — Auth + app shell (Entra ID SSO)** in flight. Phase 1 + 1.5 shipped to origin/main through commit c7de1c1; scaffold validated end-to-end locally (`npm run build` exit 0, `/design` gallery renders in browser against dark-indigo tokens).

---

## Completed

### Phase 0 documentation

- ✓ Module specs locked:
  - `docs/modules/NOTES_AND_TASKS.md` (Pass 1 + 2a/b/c merged) — 1,408 lines
  - `docs/modules/PRICING_AGENT.md` (Pass 1 + 2a/b/c merged) — 2,469 lines
- ✓ Style guide rewritten (twice): CareInMotion brand palette, then pivoted to dark indigo (`docs/STYLE_GUIDE.md`)
- ✓ Architecture doc updated with hosting decision, API-first design, Graph pre-provisioning (`docs/ARCHITECTURE.md`) — 419 lines

### Wave 1 — schema cleanup (2026-04-19)

- ✓ Wave 1 schema cleanup SQL written (`migrations/versions/001` through `004`)
- ✓ Wave 1 executed against `sales.*` catalog — all 4 migrations applied honestly
  - 001 created `sales.core.schema_migrations` (via Genie — audit row shows `<operator-email>` placeholder)
  - 002 created `sales.core.features` with 5 seed rows incl. `pricing_approver_email` (via Genie)
  - 003 dropped `sales.app.industry_news_feed` (79 stale rows) — Kevin re-executed after Genie's false-positive tracking
  - 004 dropped `sales.pricing.proposals` (empty scaffold) — Kevin re-executed after Genie's false-positive tracking
- ✓ Tracking table verified clean: 4 rows 001-004, no phantom 005
- ✓ Pre-flight discovered audit imprecision: `sales.pricing.proposal_exports/sections` never existed. Original migration 005 deleted, Wave 2+ renumbered down by one

### Phase 1 — Design system files (2026-04-19, f80b639)

- ✓ Repo init script (`scripts/phase-1-init.sh`) — Next.js 14 scaffold + deps
- ✓ Design tokens (`src/lib/tokens.ts`) — typed, mirrors CSS variables
- ✓ Classname utility (`src/lib/cn.ts`) — clsx + tailwind-merge
- ✓ Global CSS (`src/app/globals.css`)
- ✓ Tailwind config (`tailwind.config.ts`) — no arbitrary values, all tokens
- ✓ ESLint config (`.eslintrc.json`) — hex-value ban rule in .tsx files
- ✓ Prettier config (`.prettierrc`) — with Tailwind class sorting
- ✓ Root layout (`src/app/layout.tsx`)
- ✓ Placeholder home (`src/app/page.tsx`) — link to design gallery
- ✓ Design gallery (`src/app/design/page.tsx`) — all primitives visualized
- ✓ Three primitives (`Button.tsx`, `Input.tsx`, `Card.tsx`) — matching STYLE_GUIDE §6
- ✓ Scaffold run locally, pushed to origin/main (c7de1c1)
- ✓ `npm run build` exit 0, `/design` renders in browser, visually validated against STYLE_GUIDE (dark bg, danger button red, ghost hover lift, input error lines-not-blocks, typed input body tier)

**No Storybook.** `/design` route replaces it.

### Phase 1 — Design system pivot to dark indigo (2026-04-19, 26a3a34)

- ✓ `docs/STYLE_GUIDE.md` §1–§3 + §2.11/2.12 rewritten: dark-first, single indigo accent, paired semantic fg/bg, neutrals named by role (9 stops), Inter + JetBrains Mono, 14px body, weights restricted to 400/500
- ✓ Downstream sections (§5 borders, §6 component specs, §10 charts, §11 empty states, §12 theme toggle, §13 a11y) updated to reference new tokens
- ✓ CareInMotion periwinkle/coral/navy palette dropped; category tokens deferred until Phase 8
- ✓ `src/app/globals.css` rewritten — dark-only, `color-scheme: dark`, no light mode shim
- ✓ `src/lib/tokens.ts` regenerated against new vars
- ✓ `tailwind.config.ts` — color names flattened to new neutral/accent/semantic grouping, scale rebuilt (`micro` / `caption` / `body` / `section` / `page-title`)
- ✓ `src/app/layout.tsx` — Geist replaced by Inter (weights 400/500) + JetBrains Mono (400) via `next/font/google`
- ✓ `src/app/page.tsx` — updated to use new scale + text tokens
- ✓ Button / Input / Card — token rename pass (no structural changes)
- ✓ `/design` gallery — renders every neutral stop, accent trio, semantic pair, typography scale, elevation layers, all primitive variants
- ✓ Light mode deferred entry added to `docs/DEFERRED.md`
- ✓ `docs/GOTCHAS.md` — three new entries: dual-family `next/font/google`, Tailwind `bg-bg-*` nesting, semantic fg/bg pair rule
- ✓ Zero `#` hex values in `src/components/` or `src/app/` (other than globals.css variable definitions)

### Phase 1.5 — Design system cleanup (2026-04-19, 4aab76f)

- ✓ Text tiers collapsed from 5 → 3 (`text-muted` / `text-body` / `text-primary`); `text-secondary` + `text-strong` dropped
- ✓ `--text-muted` absorbed `secondary` hex (`#71717A`); old muted `#52525B` retired
- ✓ Full-repo grep sweep: zero residual `text-secondary` / `text-strong` / `--text-secondary` / `--text-strong` references across `.md`, `.tsx`, `.ts`, `.css`
- ✓ CSS vars pruned (`src/app/globals.css`), typed tokens (`src/lib/tokens.ts`) and Tailwind config (`tailwind.config.ts`) regenerated to 3-tier
- ✓ Button `secondary` fg → `text-text-body` (font-medium already in base); ghost hover fg → `text-text-primary` (preserves hover lift)
- ✓ Button `danger` variant verified on semantic tokens (`bg-danger-bg text-danger-fg`); never `accent`
- ✓ Input typed value fg → `text-text-body` (hierarchy: muted placeholder → body typed → primary label)
- ✓ Input error pattern canonicalized as "lines, not blocks" — `border-danger-fg` + `text-danger-fg` helper + `ring-danger-fg/20` focus; no `bg-danger-bg` fill
- ✓ `/design` gallery: two dropped swatches removed, three remaining text swatches gained usage labels, Input error renders to spec
- ✓ STYLE_GUIDE updates: §2.1 neutrals table (3 tiers, 9 stops), §2.11 CSS var block, §3 proposal-scale disclaimer + new §3.4 concrete usage table, §6.1 Button variant color reference block, §6.2 Input error prose, §10 chart axis stroke (`--text-muted`)
- ✓ `docs/GOTCHAS.md` — new entry "Dropping a design token = multi-file rename, not a delete"
- ✓ Zero `#` hex values in `src/components/` or `src/app/` outside `globals.css` variable definitions

### Phase 2 — Auth + app shell (2026-04-19, `<pending commit>`)

- ✓ `next-auth@5.0.0-beta.31` + `zod@4.3.6` installed; `npm ls` confirms 5.x
- ✓ `src/lib/env.ts` — Zod-validated startup env check for the 5 NEXTAUTH_* / AZURE_AD_* vars (crash fast with per-var messaging)
- ✓ `src/auth.ts` (NOT `src/lib/auth.ts`) — NextAuth v5 config; AzureAD provider with pinned `id: "azure-ad"`; JWT strategy; callbacks capture `sub/email/name/given_name/family_name` from OIDC profile; exports `{ auth, handlers, signIn, signOut }` + `getSessionUser()` + `requireAuth()`
- ✓ `src/middleware.ts` — re-exports `auth` as middleware with matcher regex excluding `/`, `/auth/*`, `/design`, `/_next/*`, `/api/*`, `/favicon.ico`
- ✓ `src/app/api/auth/[...nextauth]/route.ts` — destructures `{ GET, POST }` from `handlers`
- ✓ `src/app/auth/signin/page.tsx` — centered 400px card on `bg-page`, primary CTA triggering `signIn('azure-ad')`, reads callbackUrl from query
- ✓ `src/app/auth/error/page.tsx` — keyed error copy with raw code shown in mono for triage
- ✓ App shell — `Sidebar` (240px, active indigo border-left, disabled items rendered as `<span>`), `TopBar` (56px), `UserMenu` (avatar dropdown with outside-click / route-change / Escape close), `AppShell`, `SessionProviderWrapper`
- ✓ `src/app/(app)/layout.tsx` — wraps protected routes in SessionProvider + AppShell (does NOT re-declare `<html>`/`<body>`)
- ✓ `src/app/(app)/dashboard/page.tsx` — placeholder landing, calls `requireAuth()`
- ✓ `src/app/page.tsx` — unauthenticated landing with sign-in CTA + /design link
- ✓ `src/types/next-auth.d.ts` — Session + JWT augmentation for Entra claims
- ✓ `tailwind.config.ts` — added `maxWidth['sign-in']: '400px'` (one-off token for sign-in/error cards)
- ✓ CLAUDE.md rule #2 updated: path changed from `/src/lib/auth.ts` to `/src/auth.ts` (NextAuth v5 convention)
- ✓ `docs/GOTCHAS.md` — three new entries: v5 azure-ad provider is deprecated re-export, middleware prefix match collisions, `auth()` helper dual-role

**Verification (from worktree):** `npx tsc --noEmit`, `npm run lint`, `npm run build` — see self-check report for exit codes and output. Build was run with stub env values (.env.local is not in this worktree per .gitignore; dev runtime picks up the real values from main worktree's .env.local).

---

## Queued — top 3 for next phase

1. **Phase 3 — Data layer** (Databricks SQL connection, migration runner, repository pattern, observability). Wave 2 migrations (005 rename deals→opportunities, 006 create leads) run here through the first-party runner. Also: reconcile Entra claims with `sales.core.users.email` per ARCHITECTURE.md open question.

2. **Phase 4 — Pricing Agent** (first revenue-path module). Seed-file COGS; `partner_contracts` integration deferred to Phase 4.5.

3. **GOTCHAS update — Genie / AI migration runner ban.** Document that AI assistants (Genie, Claude, etc.) must NOT be used as migration runners. Phase 3's runner must be first-party Node/Python code. (Carried over from previous top 3 — still unchecked.)

---

## Deferred

See `/docs/DEFERRED.md` for items explicitly not being built right now, with rationale and revisit conditions.

---

## Phase roadmap (reference)

| Step | Scope | Sessions |
|---|---|---|
| Phase 0 | Repo scaffold (docs) | 1 |
| **Wave 1** | **Schema cleanup (4 migrations)** | **0.5 (hand-executed 2026-04-19)** |
| Phase 1 | Design system + primitives | 1–2 (**files generated 2026-04-19**) |
| Phase 2 | Auth + app shell (Entra ID SSO) | 1 |
| Phase 3 | Data layer + migrations + observability + sales.app audit | 1–2 |
| Phase 4 | **Pricing Agent** (first revenue-path module) | 2 |
| Phase 5 | Opportunities module (with deal_users + pricing_visibility) | 1–2 |
| Phase 6 | Proposal Generator (HTML + PDF) | 2 |
| Phase 7 | Overview + Intelligence feeds | 1–2 |
| Phase 8 | Notepad Agent | 2 |
| Phase 9 | Tests, feature flags, demo mode | 1 |
| Phase 10 | Deploy + v1 hard cutover | 1 |

Total: ~15 sessions plus Wave 1. See `/docs/REBUILD_PLAN.md` for per-phase detail and exit criteria.

---

## Update protocol

- At the end of every Claude Code session, this file is updated.
- Completed items move from "In flight" to "Completed" with the commit hash.
- The "Queued — top 3" list is refreshed to reflect what's next.
- Commit this file in the same commit as the code change.
