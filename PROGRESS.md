# AIM v2 — Progress

**Last updated:** 2026-04-19 (Phase 2 dark indigo pivot applied to Phase 1 files)

---

## Current phase

**Phase 2 — Design system pivot (dark indigo)** complete. Phase 1 file generation + local execution still in flight (same blockers as before: scaffold not yet run locally).

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

### Phase 1 — Design system files (2026-04-19)

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

**No Storybook.** `/design` route replaces it.

### Phase 2 — Design system pivot to dark indigo (2026-04-19)

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

**Verification (typecheck / lint / build):** not executable in this session — the Phase 1 scaffold (`scripts/phase-1-init.sh`) has not been run locally, so there is no `package.json` / `node_modules` to drive `npm` commands. Exit code 127 on all three with ENOENT for `package.json`. This is the same state this repo was in before the pivot; running the init script is a gating step before any build verification is possible.

---

## In flight

### Phase 1/2 — Local execution

- [ ] Kevin creates GitHub repo at `kjrit11/Aim-v2.0` (empty, no README)
- [ ] Kevin runs `scripts/phase-1-init.sh` locally — creates scaffold, installs deps
- [ ] Kevin drops generated files into the scaffolded repo (now dark-indigo), overwriting defaults
- [ ] Kevin runs `npx tsc --noEmit && npm run lint && npm run build` — verifies zero errors
- [ ] Kevin runs `npm run dev`, visits `/design` — sees all primitives render against `#08080B`
- [ ] Kevin commits + pushes first real code commit to `kjrit11/Aim-v2.0` main

**Exit criteria:** All boxes above checked. Design gallery renders at `/design` with every token visible (9 neutrals, 3 accent, 4 semantic pairs), all four button variants, all three sizes, input states, card variants, typography scale.

---

## Queued — top 3 for next phase

1. **Phase 2 — Auth + app shell** (Entra ID SSO). First phase with actual user-facing behavior. Authenticated routes, sign-in page, app chrome (sidebar + top bar). Starts on top of the Phase 1/2 dark-indigo design system.

2. **Phase 3 — Data layer** (Databricks SQL connection, migration runner, repository pattern, observability). Wave 2 migrations (005 rename deals→opportunities, 006 create leads) run here through the first-party runner.

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

---

## Deferred

See `/docs/DEFERRED.md` for items explicitly not being built right now, with rationale and revisit conditions.

---

## Phase roadmap (reference)

| Step | Scope | Sessions |
|---|---|---|
| Phase 0 | Repo scaffold | 1 |
| **Wave 1** | **Schema cleanup (4 migrations)** | **0.5 (hand-executed)** |
| Phase 1 | Design system + primitives | 1–2 |
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
