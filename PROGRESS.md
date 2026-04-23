# AIM v2 — Progress

**Last updated:** 2026-04-23 (Phase 3b shipped; Phase 3c next)

---

## Current phase

**Between phases.** Phase 3b shipped to `origin/main` in merge commit `6bb0187` on 2026-04-23. Phase 3c (SCIM role derivation) is next.

---

## Completed

### Phase 0 documentation

- ✓ Module specs locked: `docs/modules/NOTES_AND_TASKS.md` (1,408 lines), `docs/modules/PRICING_AGENT.md` (2,469 lines)
- ✓ Style guide rewritten twice (CareInMotion palette → dark indigo); `docs/STYLE_GUIDE.md`
- ✓ Architecture doc updated (since rewritten in Phase 2b for Databricks Apps pivot); `docs/ARCHITECTURE.md`

### Wave 1 — schema cleanup (2026-04-19)

- ✓ Migrations 001–004 hand-executed against `sales.*` catalog
  - 001 created `sales.core.schema_migrations`
  - 002 created `sales.core.features` with 5 seed rows
  - 003 dropped `sales.app.industry_news_feed`
  - 004 dropped `sales.pricing.proposals`
- ✓ Tracking table verified: 4 rows, checksum='bootstrap' (grandfathered from Phase 3b runner perspective)

### Phase 1 — Design system (2026-04-19, `f80b639`)

- ✓ Next.js 14 scaffold + deps; design tokens + classname utility + globals; Tailwind + ESLint hex-ban + Prettier
- ✓ Root layout + placeholder home + design gallery route
- ✓ Three primitives (Button, Input, Card); `/design` renders and passes visual validation

### Phase 1 — Dark indigo pivot (2026-04-19, `26a3a34`)

- ✓ STYLE_GUIDE rewritten dark-first with single indigo accent
- ✓ globals.css / tokens / tailwind config regenerated
- ✓ Inter + JetBrains Mono via next/font/google
- ✓ Three new gotchas captured; light mode deferred

### Phase 1.5 — Design system cleanup (2026-04-19, `4aab76f`)

- ✓ Text tiers collapsed from 5 → 3
- ✓ Full-repo grep sweep clean; Button and Input color patterns canonicalized
- ✓ New gotcha: "Dropping a design token = multi-file rename, not a delete"

### Phase 2 — Auth + app shell (2026-04-19, `7d82dd6`) — SUPERSEDED BY PHASE 2B

Originally shipped with NextAuth v5 + Azure AD / Entra ID SSO. Replaced in Phase 2b.

### Phase 2b — Platform pivot to Databricks Apps (2026-04-21, merge commit `34576fb`; supersedes `7d82dd6`)

Two-commit PR. Validated by a throwaway spike against real Databricks Apps platform on 2026-04-20.

- ✓ Commit A (`d00047c`) — removed NextAuth/Entra layer
- ✓ Commit B (`5894d94`) — Databricks Apps native identity via `x-forwarded-*` headers; databricksUser.ts; devAuth.ts; middleware rewritten; app.yaml + databricks.yml + copy-static.js; output 'standalone'; layout + dashboard + UserMenu + TopBar rewired
- ✓ Seven new gotchas documented; three deferred items added
- ✓ Out-of-scope additions flagged: TopBar prop threading; `typecheck` npm script

### Phase 3a — Data layer foundation (2026-04-22, merge commit `6fe2bc8`)

Single-commit PR (`e25f97b`) with a follow-up docs commit (`17a486f` — GOTCHAS append for `@databricks/sql` internal type import + serverless cold-start threshold).

- ✓ `executeQuery()` wrapper (parameterized, request-ID + duration logging, slow-query warn at 2s)
- ✓ `TABLES` / `VIEWS` / `qualifiedName()` constants (CLAUDE.md Rule #11)
- ✓ `requestContext.ts` AsyncLocalStorage binding
- ✓ `logger.ts` structured JSON (reads request_id + user_email from context)
- ✓ `queryConfig.ts` CACHE.* TTL constants
- ✓ Sentry config files (no-op when DSN unset — DSN still pending)
- ✓ `instrumentation.ts` runtime dispatch
- ✓ `scripts/db-smoke-test.ts` for exit validation
- ✓ env.ts promoted DATABRICKS_{WAREHOUSE_ID, SERVER_HOSTNAME, HTTP_PATH} to required; AIM_CATALOG required (no NODE_ENV default)
- ✓ Smoke test passed end-to-end against AIMv2.0 warehouse at `adb-3281615557339894.14`

### Phase 3b — Migration runner + user reconciliation + React Query + deploy config (2026-04-23, merge commit `6bb0187`)

Two-commit PR. Scope reduced from original plan after warehouse investigation: Wave 2 SQL migrations deferred entirely.

- ✓ Commit A (`aaec59a`) — `feat(phase-3b-a): migration runner (empty queue; Wave 2 migrations deferred)`
  - `scripts/migrate.ts` — SHA-256 checksum, filename-based dedup, one-statement-per-file, manual-only execution
  - Wave 2 migrations deferred: `sales.core.deals` cannot be dropped until Phase 10 v1 cutover (v1 reads it in prod). Prospects→leads deferred to Wave 3 pending audit of `sales.app.prospect_{notes, strategy, users}`.
- ✓ Commit B (`b9baccc`) — `feat(phase-3b-b): user reconciliation + React Query + deploy env declarations`
  - `src/lib/users.ts` — `getOrProvisionUser()` wrapped in `React.cache()` for per-request dedup
  - `src/lib/queryClient.ts` + `src/components/providers/QueryProvider.tsx`
  - Root layout + (app) layout + AppShell + TopBar + dashboard wired to thread `userRecord` prop
  - `app.yaml` env declarations for prod deploy (ANTHROPIC_API_KEY, AIM_CATALOG, DATABRICKS_{SERVER_HOSTNAME, HTTP_PATH, WAREHOUSE_ID})
- ✓ env.ts refactored to lazy Proxy (out-of-scope but necessary — Next 14 build workers don't inherit `.env.local`, and Commit B introduced a /dashboard → env.ts import chain that broke the build). Crash-fast semantics preserved on first real access.
- ✓ Four new gotchas: warehouse state drifts from repo; React Query per-mount pattern; sales.core.users seed data context; role vocabulary prose-case + lazy env
- ✓ Pre-merge smoke: `npx tsx scripts/migrate.ts` returned "No pending migrations. 4 already applied." exit 0 — runner verified end-to-end

---

## Queued — top 3 for next phase

1. **Phase 3c — SCIM role derivation.** App service principal reads group membership via Databricks SCIM API for the current user, filters on `AIM *` prefix, caches result on `sales.core.users.role`. Replaces the deleted Entra/Graph path. Unblocks proper per-role access control for Phase 4+ features.

2. **Phase 4 — Pricing Agent** (first revenue-path module). Seed-file COGS, implementation-fee bands, `partner_contracts` still deferred to 4.5. First real feature built on the Phase 3a/3b foundation.

3. **Dependency + warning housekeeping.** (a) `npm audit` reports 9 vulnerabilities (mostly transitive Next.js + Sentry gaps, fix requires major-version bumps — Next 14→16, Sentry 8→10); scope as dedicated security PR pre-Phase 10. (b) Quiet `@databricks/sql` + `@sentry/nextjs` webpack warnings (optional peers missing: `bufferutil`, `utf-8-validate`, `lz4`); cosmetic, non-blocking.

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
| Phase 3a | Data layer foundation (executeQuery, logger, Sentry scaffold) | 1 (**shipped 2026-04-22**) |
| Phase 3b | Migration runner + user reconciliation + React Query + deploy config | 1 (**shipped 2026-04-23**) |
| Phase 3c | SCIM role derivation | 0.5–1 |
| Phase 4 | **Pricing Agent** (first revenue-path module) | 2 |
| Phase 5 | Opportunities module (with deal_users + pricing_visibility) | 1–2 |
| Phase 6 | Proposal Generator (HTML + PDF) | 2 |
| Phase 7 | Overview + Intelligence feeds | 1–2 |
| Phase 8 | Notepad Agent | 2 |
| Phase 9 | Tests, feature flags, demo mode | 1 |
| Phase 10 | Deploy + v1 hard cutover (includes drop `sales.core.deals` migration) | 1 |

Total: ~15 sessions plus Wave 1. See `/docs/REBUILD_PLAN.md` for per-phase detail and exit criteria.

---

## Update protocol

- At the end of every Claude Code session, this file is updated.
- Completed items move from "In flight" to "Completed" with the commit hash.
- The "Queued — top 3" list is refreshed to reflect what's next.
- Commit this file in the same commit as the code change, or standalone if the code is already merged.