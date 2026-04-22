# AIM v2 — Progress

**Last updated:** 2026-04-22 (Phase 3a data-layer foundation shipped)

---

## Current phase

**Between phases.** Phase 3a shipped on 2026-04-22 (commit hash TBD — Kevin fills in after PR merge). Phase 3b is the next thing to pick up.

---

## Completed

### Phase 0 documentation

- ✓ Module specs locked:
  - `docs/modules/NOTES_AND_TASKS.md` (Pass 1 + 2a/b/c merged) — 1,408 lines
  - `docs/modules/PRICING_AGENT.md` (Pass 1 + 2a/b/c merged) — 2,469 lines
- ✓ Style guide rewritten (twice): CareInMotion brand palette, then pivoted to dark indigo (`docs/STYLE_GUIDE.md`)
- ✓ Architecture doc updated with hosting decision, API-first design, Graph pre-provisioning (`docs/ARCHITECTURE.md`) — 419 lines (since rewritten in 2b to reflect Databricks Apps pivot)

### Wave 1 — schema cleanup (2026-04-19)

- ✓ Wave 1 schema cleanup SQL written (`migrations/versions/001` through `004`)
- ✓ Wave 1 executed against `sales.*` catalog — all 4 migrations applied honestly
  - 001 created `sales.core.schema_migrations` (via Genie — audit row shows `<operator-email>` placeholder)
  - 002 created `sales.core.features` with 5 seed rows incl. `pricing_approver_email` (via Genie)
  - 003 dropped `sales.app.industry_news_feed` (79 stale rows) — Kevin re-executed after Genie's false-positive tracking
  - 004 dropped `sales.pricing.proposals` (empty scaffold) — Kevin re-executed after Genie's false-positive tracking
- ✓ Tracking table verified clean: 4 rows 001-004, no phantom 005
- ✓ Pre-flight discovered audit imprecision: `sales.pricing.proposal_exports/sections` never existed. Original migration 005 deleted, Wave 2+ renumbered down by one

### Phase 1 — Design system files (2026-04-19, `f80b639`)

- ✓ Repo init script, Next.js 14 scaffold + deps
- ✓ Design tokens, classname utility, global CSS, Tailwind config, ESLint config with hex-value ban, Prettier config
- ✓ Root layout, placeholder home, design gallery route, three primitives (Button, Input, Card)
- ✓ Scaffold pushed to origin/main, build clean, /design renders and passes visual validation

**No Storybook.** `/design` route replaces it.

### Phase 1 — Design system pivot to dark indigo (2026-04-19, `26a3a34`)

- ✓ STYLE_GUIDE §1–§3 + §2.11/2.12 rewritten for dark-first with single indigo accent
- ✓ All downstream sections (§5, §6, §10, §11, §12, §13) updated to new tokens
- ✓ CareInMotion periwinkle/coral/navy palette dropped
- ✓ globals.css rewritten dark-only; tokens.ts regenerated; tailwind.config.ts flattened to new grouping
- ✓ Inter + JetBrains Mono via next/font/google replacing Geist
- ✓ Button / Input / Card token renames
- ✓ /design gallery renders every token and variant
- ✓ Light mode deferred; three new gotchas captured
- ✓ Zero `#` hex values outside globals.css variable definitions

### Phase 1.5 — Design system cleanup (2026-04-19, `4aab76f`)

- ✓ Text tiers collapsed from 5 → 3 (`text-muted` / `text-body` / `text-primary`)
- ✓ Full-repo grep sweep confirms zero residual references to dropped tokens
- ✓ CSS vars pruned, typed tokens and Tailwind config regenerated
- ✓ Button and Input color patterns re-canonicalized (danger uses semantic tokens, error is "lines, not blocks")
- ✓ /design gallery updated, STYLE_GUIDE reference tables updated
- ✓ New gotcha: "Dropping a design token = multi-file rename, not a delete"

### Phase 2 — Auth + app shell (2026-04-19, `7d82dd6`) — SUPERSEDED BY PHASE 2B

Originally shipped with NextAuth v5 + Azure AD / Entra ID SSO. Replaced in Phase 2b.

### Phase 2b — Platform pivot to Databricks Apps (2026-04-21, merge commit `34576fb`; supersedes `7d82dd6`)

Two-commit PR on `platform-pivot-databricks-apps` (branch now deleted). Validated by a throwaway spike against the real Databricks Apps platform on 2026-04-20 before execution.

- ✓ Commit A (`d00047c`) — `refactor(platform): remove NextAuth + Entra ID auth layer`. Deletes `src/auth.ts`, the NextAuth route handler, `/auth/signin` + `/auth/error` pages, `next-auth.d.ts`, `SessionProviderWrapper`. Strips Entra/NextAuth env vars. Removes `next-auth` dependency. Intentionally leaves build broken mid-PR.
- ✓ Commit B (`5894d94`) — `feat(platform): add Databricks Apps native identity via x-forwarded-* headers`. Adds:
  - `src/lib/databricksUser.ts` — `getDatabricksUser()` / `requireDatabricksUser()` reading `x-forwarded-email`, `x-forwarded-user`, `x-forwarded-preferred-username`, `x-forwarded-access-token`
  - `src/lib/devAuth.ts` — dev shim, dynamically required, tree-shaken from prod
  - `src/middleware.ts` — request-ID header attach, prod 401 on missing `x-forwarded-email`
  - `app.yaml` + `databricks.yml` + `copy-static.js` at repo root for Databricks Apps deploy
  - `next.config.mjs` — `output: 'standalone'`
  - Updated Zod env schema: `ANTHROPIC_API_KEY` required, 8 optional `DATABRICKS_*` + `NEXT_DEPLOYMENT_ID` auto-injected
  - Rewires `(app)/layout.tsx` / dashboard / AppShell / TopBar / UserMenu to prop-thread the user
  - Converts `/` to server-side redirect to `/dashboard`
- ✓ Seven new gotchas documented in `docs/GOTCHAS.md`: static-copy postbuild, `{userId}@{workspaceId}` parse, OBO token arrives by default, 8 auto-injected env vars (not 3), bundle/manual state conflict, deploy-is-two-steps, PowerShell stderr coloring
- ✓ Three items added to `docs/DEFERRED.md`: role derivation via SCIM, push-to-main auto-deploy, OBO fallback strategy
- ✓ Post-merge on `main`: typecheck, lint, build all exit 0

**Known out-of-scope additions made during execution, flagged in PR review:**
- `src/components/layout/TopBar.tsx` modified to thread the `user` prop from AppShell to UserMenu — necessary byproduct
- `"typecheck": "tsc --noEmit"` added to `package.json` scripts — CLAUDE.md references this command but no script existed

### Phase 3a — Data layer foundation (2026-04-22, commit hash TBD)

Single-commit PR on `phase-3a-data-foundation`. Establishes plumbing for every feature after this point. Smoke test (`scripts/db-smoke-test.ts`) must be run manually by Kevin with a real `DATABRICKS_TOKEN` before merge.

- ✓ `src/lib/db.ts` — `executeQuery<T>(sql, params?)` wrapper over `@databricks/sql`. Parameterized only (positional `?` rewritten to named `:param_N`). Per-call structured log with `duration_ms`, `row_count`, `sql_hash`. `>2s` warn + Sentry breadcrumb. Exports `TABLES`, `VIEWS`, `resolveCatalog()`, `qualifiedName()`. PAT preferred, SP-creds fallback.
- ✓ `src/lib/logger.ts` — structured JSON logger. Reads `request_id` / `user_email` from `requestContext`. `log.info/warn/error/debug`. `debug` no-op in prod. No third-party deps.
- ✓ `src/lib/requestContext.ts` — `AsyncLocalStorage` binding with `withRequestContext(ctx, fn)` and `getContext()`.
- ✓ `src/lib/queryConfig.ts` — `CACHE.*` TTL constants (`PRICING`, `INTEL_FEEDS`, `OPPORTUNITIES`, `USERS`) with `SECOND/MINUTE/HOUR/DAY` helpers.
- ✓ `src/instrumentation.ts` + `sentry.{server,client,edge}.config.ts` — Sentry scaffolding. No-ops cleanly when `SENTRY_DSN` is empty. TODOs point at DSN acquisition.
- ✓ `src/middleware.ts` — stamps `x-request-id` on incoming request headers (via `NextResponse.next({ request: { headers } })`) and response headers. No ALS at the Edge.
- ✓ `src/app/(app)/layout.tsx` — reads `x-request-id` via `headers()`, binds via `withRequestContext` so Node-runtime descendants inherit it.
- ✓ `src/lib/env.ts` — `AIM_CATALOG` required (no default), `DATABRICKS_{WAREHOUSE_ID,SERVER_HOSTNAME,HTTP_PATH}` promoted from optional to required, `DATABRICKS_TOKEN` + `SENTRY_DSN` optional.
- ✓ `scripts/db-smoke-test.ts` — standalone `SELECT 1 AS ok` validator (tiny inline `.env.local` parser — no dotenv dep). Run with `npx tsx scripts/db-smoke-test.ts`.
- ✓ `docs/DEV_SETUP.md` — PAT generation, `.env.local` contents, catalog routing, Sentry stub behavior.
- ✓ `docs/GOTCHAS.md` — new Phase 3a gotcha: "AsyncLocalStorage is Node-runtime-only" (middleware uses request-header pass-through instead).
- ✓ `docs/REBUILD_PLAN.md` — Phase 3 section restructured into 3a/3b/3c with exit criteria each.
- ✓ `CLAUDE.md` — "Where things live" now points at `src/lib/db.ts` for table/view name constants.
- ✓ `package.json` — added `@databricks/sql`, `@sentry/nextjs`; added `tsx` devDep for smoke test.
- ✓ `.env.example` — `AIM_CATALOG`, `DATABRICKS_TOKEN`, and updated `SENTRY_DSN` comment.

**Out-of-scope (deferred to 3b as planned):** user reconciliation, `/api/health` route, migration runner, Wave 2 migrations, first deploy.

---

## Queued — top 3 for next phase

1. **Phase 3b — User reconciliation + Wave 2 migrations + first deploy.** `src/lib/users.ts` (email-based reconciliation against `sales.core.users.email`, auto-provision on miss). Reconcile-on-layout pattern in `(app)/layout.tsx` — extends the 3a `withRequestContext` binding to also include the resolved user ID / role. `scripts/migrate.ts` first-party Node migration runner. Wave 2 migrations 005 (rename `deals`→`opportunities` with backwards-compat view) and 006 (create `sales.core.leads` via CTAS from `sales.app.prospects`). `/api/health` route runs a tiny `executeQuery` + reports latency. First Databricks Apps deploy: `databricks bundle deploy -t dev` + `databricks apps deploy aim-v2-dev --source-code-path ...`.

2. **Phase 3c — SCIM role derivation.** App service principal reads group membership via SCIM, filters on `AIM *` prefix, caches on `sales.core.users.role`. Replaces the deleted Entra/Graph path. Separate axis of complexity (external API calls + caching) — not bundled with 3b.

3. **Phase 4 — Pricing Agent (first revenue-path module).** Port v1's pricing calculation logic to the new data layer. 5 segment buttons, 20-band auto-detect, discount slider with 3 approval zones, COGS breakdown, margin floor enforced. `deal_users.pricing_visibility` gates margin/COGS visibility when viewed in a deal context. Consumes `CACHE.PRICING` TTLs.

---

## Deferred

See `/docs/DEFERRED.md` for items explicitly not being built right now, with rationale and revisit conditions.

---

## Phase roadmap (reference)

| Step | Scope | Sessions |
|---|---|---|
| Phase 0 | Repo scaffold (docs) | 1 |
| **Wave 1** | **Schema cleanup (4 migrations)** | **0.5 (hand-executed 2026-04-19)** |
| Phase 1 | Design system + primitives | 1–2 (**shipped 2026-04-19**) |
| Phase 2 | Auth + app shell (Databricks native) | 1 (**shipped 2026-04-21 via 2b**) |
| Phase 3a | Data layer foundation (executeQuery, logger, Sentry) | 1 |
| Phase 3b | User reconciliation + Wave 2 migrations + first deploy | 1 |
| Phase 3c | SCIM role derivation | 0.5–1 |
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
