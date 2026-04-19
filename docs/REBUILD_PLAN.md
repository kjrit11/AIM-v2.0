# AIM v2 Rebuild Plan

**Target:** Claude Code
**Owner:** Kevin Ritter, CareInMotion
**Repo:** `kjrit11/Aim-v2.0`
**Created:** 2026-04-17
**Last updated:** 2026-04-18 (Wave 1 cleanup added; schema audit findings baked into Phases 3–7)
**Supersedes:** All prior AIM prompts. The v1 codebase at `kjrit11/SalesCommandCenter` stays frozen until Phase 10 cutover.

---

## 0. Read this first — session opener discipline

Every Claude Code session on this repo MUST start with the opener from `CLAUDE.md`:

```
Read CLAUDE.md, docs/ARCHITECTURE.md, docs/STYLE_GUIDE.md, and docs/GOTCHAS.md
in that order. Then report:
  1. The current phase of the rebuild (from PROGRESS.md)
  2. The top 3 open items in PROGRESS.md
  3. Which files you will touch to address item #1

Do not write any code until you have reported all three.
```

If any file is missing, stop and tell Kevin. Do not proceed.

---

## 1. Why we are rebuilding

v1 (`kjrit11/SalesCommandCenter`) accumulated fatal technical debt:

- 84 unresolved TypeScript errors
- Two overlapping backends (Next.js + FastAPI) with unclear boundaries
- Loose SQL files (009–013 with a gap at 011) instead of versioned migrations
- `sales.app.*` tables living alongside schema-owner tables, with real data in both
- Overview and Notepad broken after every rebuild
- No observability, no tests, no feature flags
- Zero environment parity

We are not porting the code. We are rebuilding the application layer in a fresh repo with what we learned. The data layer is unchanged in structure; we inherit `sales.*` as it exists, with targeted cleanups.

See `/docs/ARCHITECTURE.md` for per-decision rationale, including the full schema inventory from the 2026-04-18 audit.

---

## 2. What we are keeping

| Asset | Source | Destination |
|---|---|---|
| `sales.pricing.*` (16 tables + 2 views) | Databricks | Keep in place — authoritative for Pricing Agent |
| `sales.notepad.*` (8 tables + 5 views) | Databricks | Keep in place — authoritative for Notepad Agent |
| `sales.gold.*` intel feeds | Databricks | Keep — authoritative for Phase 7 |
| `sales.core.accounts`, `sales.core.users`, `sales.core.sessions`, `sales.core.deal_users` | Databricks | Keep |
| `sales.core.deals` | Databricks | Rename to `sales.core.opportunities` at Phase 3 with backwards-compat view |
| `sales.app.prospects` + satellites | Databricks | Migrate to `sales.core.leads` at Phase 3 |
| `sales.app.proposals` + satellites (live, 3 rows) | Databricks | Migrate to `sales.core.proposals` at Phase 6 |
| `sales.app.kb_*` (live content — 18 articles, 7 categories, 16 assets) | Databricks | Keep in place, not consumed in v2 MVP |
| `sales.app.deal_files`, `deal_file_content`, `deal_notes`, `deal_strategy`, `deal_workspace_summary` | Databricks | Keep read-only; consider move to `sales.core` at Phase 10 |
| React Query centralized TTLs | v1 `queryConfig.ts` | `/src/lib/queryConfig.ts` |
| Category color tokens | v1 CLAUDE.md §3 | `/src/styles/tokens.ts` |
| Pricing Agent business logic | v1 `/agents/pricing` | Rebuild UI, port calculation logic |
| Segment key normalization | v1 `pricingService.ts` | Carry forward |
| Hard-won gotchas | v1 `CLAUDE.md` § 21 | `/docs/GOTCHAS.md` |

---

## 3. What we are NOT porting

- ❌ FastAPI service
- ❌ v1 SQL files 001–013
- ❌ v1 Overview layout (6-row, KPI cards, daily quote banner)
- ❌ v1 Notepad 3-pane layout
- ❌ Montserrat / Open Sans / JetBrains Mono / Inter mixed — Geist with Inter fallback only
- ❌ `#151845` navy as primary background — minimalist grays with indigo accent
- ❌ Inline hex values in components — tokens only
- ❌ NextAuth Credentials provider with bcrypt — replace with Entra ID SSO
- ❌ v1's 641-line `CLAUDE.md`
- ❌ `sales.app.industry_news_feed` (stale duplicate — use `sales.gold.industry_news_feed`; dropped in Wave 1)
- ❌ `sales.pricing.proposals`, `sales.pricing.proposal_exports`, `sales.pricing.proposal_sections` (empty scaffolds — dropped in Wave 1)

---

## 4. Stack (locked)

See `/CLAUDE.md` § Stack.

---

## 5. Directory structure

See `/docs/ARCHITECTURE.md`. Created progressively as phases ship.

---

## 6. Phased build order

Each phase has an explicit exit criterion. Do not start phase N+1 until phase N passes.

---

### Phase 0 — Repo scaffold (1 session)

- Create GitHub repo `kjrit11/Aim-v2.0`
- Initialize Next.js 14 App Router with TypeScript strict
- Write `CLAUDE.md`, `PROGRESS.md`, `README.md`
- Write `docs/ARCHITECTURE.md`, `docs/STYLE_GUIDE.md`, `docs/MIGRATIONS.md`, `docs/WAVE_1_CLEANUP.md`, `docs/SCHEMA.md` (placeholder), `docs/GOTCHAS.md`, `docs/DEFERRED.md`
- Configure ESLint + Prettier + strict TS
- ESLint `no-restricted-syntax` rule blocks hex values in `.tsx` files
- `.env.example` documents every required env var (empty values)

**Exit:** `npm run build`, `npm run typecheck`, `npm run lint` all zero errors. Kevin reviews `CLAUDE.md` and approves.

---

### Wave 1 — Schema cleanup (runs between Phase 0 and Phase 1, ~30 min)

Safe low-regret cleanups that don't break v1. See `/docs/WAVE_1_CLEANUP.md` for the full SQL, pre-flight checks, execution order, and rollback plan.

**Scope:**
- Drop `sales.app.industry_news_feed` (stale duplicate)
- Drop `sales.pricing.proposals`, `sales.pricing.proposal_exports`, `sales.pricing.proposal_sections` (empty scaffolds)
- Create `sales.core.schema_migrations` (tracking table for all future migrations)
- Create `sales.core.features` (feature flag storage)

**Pre-flight:** Confirm no Databricks jobs write to the tables being dropped. Confirm row counts are zero (or match expected stale-data count). See WAVE_1_CLEANUP.md.

**Exit:** All Wave 1 migrations applied, recorded in `sales.core.schema_migrations`, and no errors in the Databricks audit log. v1 still functional.

---

### Phase 1 — Design system + primitives (1–2 sessions)

- `/src/styles/tokens.ts` with ALL tokens from `docs/STYLE_GUIDE.md`
- `/src/styles/globals.css` with CSS variables for light and dark
- Tailwind configured to use tokens only
- Primitives: Button, Input, Textarea, Select, Checkbox, Radio, Card, Dialog, Dropdown, Toast, Tooltip, Tabs, Badge, Avatar, Skeleton, Table
- One Storybook story per primitive
- Storybook 8 with Vite builder

**Exit:** Storybook runs locally. Every primitive renders in light and dark. ESLint reports zero hex values in `/src/components/`.

---

### Phase 2 — Auth + app shell (1 session)

- NextAuth v5 with Entra ID provider
- `/src/lib/auth.ts` with `getSessionUser()` and `requireAuth()`
- Session cookie: HTTP-only, secure, SameSite=Lax
- `(app)/layout.tsx` with sidebar + topbar
- Sidebar nav: MAIN (Overview, Opportunities, Leads, Accounts), INTEL (Policy, Industry, Competitive, AI News), AGENTS (Pricing, Proposal, Notepad), SYSTEM (Settings)
- Middleware protects all `(app)/*` routes
- Login page at `(auth)/login/page.tsx`
- On first login: match Entra email against `sales.core.users.email`. Auto-provision row if no match. Entra group → AIM role mapping.
- **Decision (Kevin):** Session timeout UX — silent token refresh vs inline re-auth prompt on 401.

**Exit:** Kevin logs in. Sees the empty app shell. Logs out. Unauthenticated access to `/overview` redirects to `/login`.

---

### Phase 3 — Data layer + migrations + observability + sales.app audit (1–2 sessions)

**Core infrastructure:**
- `/src/lib/db.ts` — Databricks SQL Connector wrapper with `executeQuery()`, parameterized queries only, request ID logging, query duration tracked
- `/src/lib/logger.ts` — structured JSON logger with request ID middleware
- `/src/lib/anthropic.ts` — Claude client with retry + timeout
- `/src/lib/features.ts` — `useFeature()` client + `getFeature()` server (reads from `sales.core.features` created in Wave 1)
- `resolveCatalog(context)` function — the only place that decides `sales.*` / `sales_dev.*` / `sales_demo.*` routing
- Sentry wired to client and server; breadcrumb on queries >2s
- `/api/health` endpoint runs a tiny DB query and reports warehouse latency

**Zod schemas** in `/src/schemas/`:
- `User`, `Account`, `Opportunity`, `Lead`, `DealUser` (with `pricingVisibility`)

**Schema audit task (completes the Wave 1 audit):**
- Run `COUNT(*)` and `SELECT * LIMIT 3` on every `sales.app.*` table not yet confirmed
- Confirm dispositions in `docs/ARCHITECTURE.md` — which are live, which are empty, which are stale
- Confirm `SELECT DISTINCT pricing_visibility FROM sales.core.deal_users` — document the full enum in GOTCHAS.md
- Identify the Salesforce sync job owner for `sales.integration.*`; document in ARCHITECTURE.md

**Migrations (Wave 2):**
- `003_rename_deals_to_opportunities_with_view.sql` — rename + backwards-compat view. v1 keeps reading `sales.core.deals`; v2 reads `sales.core.opportunities`. See `docs/MIGRATIONS.md`.
- `004_create_leads_table_and_migrate_prospects.sql` — new `sales.core.leads` table, CTAS from `sales.app.prospects` (+ prospect_notes, prospect_strategy, prospect_users). Leave the source tables in place until Phase 10. Point v2 code at the new table.

- `migrations/runner.ts` — idempotent runner
- `npm run schema:generate` populates `docs/SCHEMA.md` from `DESCRIBE TABLE` output — committed in the same PR

**Exit:** `executeQuery()` returns live rows from `sales.core.opportunities` and `sales.core.leads`. v1 still works against `sales.core.deals` via the view. Every query logs with request ID + duration. Sentry captures a deliberate test error. `docs/SCHEMA.md` is populated. `sales.app` audit complete; each table has an explicit disposition in ARCHITECTURE.md.

---

### Phase 4 — Pricing Agent (2 sessions) — FIRST REVENUE-PATH MODULE

- `/src/app/(app)/agents/pricing/page.tsx`
- Port business logic from v1 `/agents/pricing`
- 5 segment buttons (Payer, ACO, HS, HIE, CBO)
- `normalizeSegmentKey()` in `/src/lib/pricing/segments.ts`
- 20-band auto-detect from volume input
- Discount slider 0–40% with 3 approval zones
- FHIR API line item ($7.79/100K calls/mo)
- COGS breakdown bars (platform + module + implementation)
- Margin analysis with 35% floor enforced
- 13 add-on modules (read from `sales.pricing.modules`)
- Payer `recurringMultiplier = 12`
- All DB calls through `executeQuery()`, cached via `CACHE.PRICING` (24h / 48h)
- Zod schema in `/src/schemas/pricing.ts`

**Access control:**
- When Pricing Agent is viewed in-context on a specific opportunity, read `sales.core.deal_users.pricing_visibility` for the current user + current deal
- If `pricing_visibility != 'Full'`, render total price but hide margin bars, COGS breakdown, and discount percentage
- Standalone use (no deal context): show full view to all authenticated users

**Deferred until Phase 4.5:**
- Integration with `sales.pricing.partner_contracts` (6 live rows) for partner-delivered component cost pass-through. v1 used seed files (`cogs.ts`); v2 Phase 4 keeps that approach.

**Decisions (document in ARCHITECTURE.md):**
- Anthropic rate-limit degradation UX
- Graceful degradation for AI narrative on rate limit or timeout

**Exit:** Kevin can quote Payer, Band 5, 15% discount, with 2 add-on modules. All numbers match v1 Pricing Agent within $1. A user with `pricing_visibility = 'Summary'` on a deal sees total but not margin.

---

### Phase 5 — Opportunities module (1–2 sessions)

- `/opportunities` list — `@tanstack/react-table` with sort/filter/search
- Kanban view by stage
- `/opportunities/[id]` detail with tabs: Summary, Pricing, Proposal, Notes, Activity
- CRUD through Zod-validated API routes
- Full-text search across opportunity name, account, owner

**Multi-user deals:**
- List and detail pages join `sales.core.deal_users` to show all users assigned to each deal.
- "My opportunities" filter uses `deal_users` membership, not `owner_name` match.
- Deal detail page renders the users list with their `pricing_visibility` level.

**Salesforce integration decision (Kevin owns before Phase 5 ships):**
- Who owns the Databricks Salesforce sync job?
- Does `sales.core.accounts` need to merge with `sales.integration.sf_accounts_curated`?
- Are writes from v2 required to flow back to Salesforce?

Phase 5 can ship reading only from `sales.core.*` if the Salesforce decision is deferred. Document the open decision in PROGRESS.md.

**At end of Phase 5:** revoke v1's Databricks write token. v1 becomes read-only via the `sales.core.deals` view.

**Exit:** Kevin creates an opportunity, attaches a pricing quote, adds a note, changes the stage. Data persists to `sales.core.opportunities`. A user assigned via `deal_users` sees the deal in their "My opportunities" list. v1 is read-only.

---

### Phase 6 — Proposal Generator (2 sessions)

- `/agents/proposal` wizard flow
- Reads module content from `sales.pricing.modules`
- Pulls pricing snapshot from a selected opportunity's saved quote
- Writes `pricing_snapshot_json` at generation time (immutable)
- Live HTML preview in the builder
- PDF export via `@react-pdf/renderer` (separate component tree from HTML preview — shared Zod schema only)
- Geist font vendored and embedded in PDF as base64

**Proposal table migration (Wave 3):**
- Migration `005_migrate_proposals_to_core.sql` — `CREATE TABLE sales.core.proposals AS SELECT * FROM sales.app.proposals`, same for all satellite tables (`proposal_assets`, `proposal_asset_links`, `proposal_exports`, `proposal_pricing_snapshot`, `proposal_sections`, `proposal_source_snapshot`, `proposal_style_guides`, `proposal_template_assets`, `proposal_templates`)
- Backwards-compat views on `sales.app.*` pointing at `sales.core.*` so v1 keeps working
- v2 reads/writes `sales.core.proposals`

**Decisions (document in ARCHITECTURE.md):**
- Email send provider: Resend vs Azure Communication Services. Default: Resend.
- Font embedding: Geist vendored vs fallback to Inter.

**Exit:** Kevin selects an opportunity, clicks "Generate Proposal," sees a live preview, tweaks the intro, exports PDF, emails it. Pricing snapshot is stored immutable on the proposal record. Existing 3 v1 proposals still viewable.

---

### Phase 7 — Overview + Intelligence feeds (1–2 sessions)

- `/overview` — MINIMALIST rebuild per `docs/STYLE_GUIDE.md` § 8
- 4 KPI tiles (YTD pipeline, YTD closed, quota attainment, avg deal size)
- One pipeline chart (horizontal bar)
- "Recent activity" table, 5-10 rows, no cards
- NO daily quote banner, NO region cards, NO 6-row layout

**Intelligence feeds:**
- Policy feed from `sales.gold.cms_policy_feed`
- Industry News from `sales.gold.industry_news_feed` (NOT `sales.app.industry_news_feed` — dropped in Wave 1)
- Competitive Intel from `sales.gold.competitor_intel_feed`
- AI News from `sales.gold.ai_vendor_intel_feed_v` (the VIEW with canonical vendor names — not the raw table)
- Unified card layout, filter chips for category / priority / date
- All intel feeds cached for 24h via `CACHE.INTEL_FEEDS`

**Exit:** Overview loads in under 800ms on warm cache. All 4 intel feeds render with filter chips working.

---

### Phase 8 — Notepad Agent (2 sessions)

- Rebuild from style guide — NOT a port of the 3-pane layout
- Single-column default, preview opens as a side panel
- AI summarize via `/src/lib/anthropic.ts`
- Task extraction into structured list
- Category color bars per note (Client/Sales/Prospect/Internal)
- Search + filter chips
- Column names from `docs/SCHEMA.md` — `exec_summary_text` NOT `executive_brief`, `created_at` NOT `generated_at`, `category` NOT `meeting_category`

**Exit:** Kevin pastes meeting notes, clicks Summarize, gets structured summary + task list. Click a note card, preview panel opens. No blank previews.

---

### Phase 9 — Tests, feature flags, demo mode (1 session)

- 5 Playwright flows:
  1. `login.spec.ts`
  2. `pricing-calculator.spec.ts`
  3. `create-opportunity.spec.ts`
  4. `generate-proposal.spec.ts`
  5. `notepad-ai-summary.spec.ts`
- Wire Playwright to CI — block merge on failure
- Seed `sales.core.features` (created in Wave 1) with `demo_mode`, `verbose_logging`, `proposal_v2`, `ai_task_extraction`
- Admin `/settings/features` page gated to admin role
- Demo mode seed: `scripts/seed-demo.ts` creates 8 accounts, 20 opportunities, 40 leads, 15 notes, 5 proposals in `sales_demo.*`
- Rate limiting on API routes: AI routes 30 req/5min per user, mutations 60 req/min

**Exit:** `npm run test:e2e` passes green. Flipping `demo_mode: true` swaps to synthetic dataset. 429 returned on rate limit breach.

---

### Phase 10 — Deploy + v1 hard cutover (1 session)

- Dockerfile for v2
- GitHub Actions in `kjrit11/Aim-v2.0`: build → push to ACR → deploy to new Container App
- Azure Key Vault wired for all secrets (DATABRICKS_TOKEN, ANTHROPIC_API_KEY, NEXTAUTH_SECRET, SENTRY_DSN, ENTRA_CLIENT_SECRET, RESEND_API_KEY or ACS equivalent)
- `migrate.yml` workflow runs SQL migrations on merge to `main`, blocks deploy on failure

**Wave 4 — final cleanup migrations:**
- `006_drop_backwards_compat_views.sql` — drop `sales.core.deals` view (v1 stops working — intentional), drop `sales.app.proposals` facade view, etc.
- `007_drop_legacy_sales_app_tables.sql` — drop all `sales.app.*` tables that weren't migrated and aren't KB-related
- `008_drop_password_hash_column.sql` — remove unused `sales.core.users.password_hash`

**Hard cutover procedure:**
1. Confirm v1 has been read-only since Phase 5
2. Run Wave 4 migrations against prod
3. DNS / custom domain CNAME updated from v1 Container App to v2 Container App
4. Watch Sentry + `/api/health` + logs for 2 hours
5. If green: stop v1's Container App (do not delete yet)
6. After 7 days: delete v1 Container App, archive `kjrit11/SalesCommandCenter` on GitHub

- Custom domain + TLS on v2 Container App
- **Decision (Kevin):** Databricks cost alert threshold and recipient

**Exit:** Production URL serves v2. Kevin logs in from a fresh browser and completes all 5 Playwright flows by hand. v1 Container App is stopped.

---

## 7. Success criteria

- [ ] Zero TypeScript errors at any point in the repo history
- [ ] Every page loads in under 1s on warm cache
- [ ] Every critical flow has a Playwright test
- [ ] Every primitive has a Storybook story
- [ ] Every API route has a Zod schema
- [ ] Migrations run cleanly from zero against an empty dev catalog
- [ ] Sentry captures errors in production
- [ ] Query duration logged on every `executeQuery()` call
- [ ] Demo mode works — one flag flip swaps datasets
- [ ] Kevin generates a proposal end-to-end in under 3 minutes
- [ ] v1 Container App is stopped and v2 serves all traffic after Phase 10
- [ ] v1 repo is archived on GitHub after Phase 10 +7 days

---

## 8. What's explicitly deferred

See `/docs/DEFERRED.md` for the full list. Summary:

- Knowledge Base (scaffolded with content; revisit after Phase 6 ships)
- `partner_contracts` integration into Pricing Agent (Phase 4.5)
- Salesforce sync integration beyond read-only reference (Phase 5 decision)
- Real-time collaboration, mobile app, multi-tenant, i18n, vector search, voice input, public API, offline mode

---

## 9. Open questions — to resolve before the referenced phase

| Question | Decide by | Owner |
|---|---|---|
| Entra email ↔ `sales.core.users.email` reconciliation edge cases | Phase 2 | Kevin |
| Session timeout UX | Phase 2 | Kevin |
| `pricing_visibility` distinct values (confirm enum) | Phase 3 | Kevin |
| Salesforce sync job ownership + overlap with `sales.core.accounts` | Phase 5 | Kevin |
| Anthropic rate-limit degradation UX | Phase 4 | Kevin |
| `partner_contracts` integration scope | Phase 4.5 (deferred) | Kevin |
| Email send provider: Resend vs Azure Communication Services | Phase 6 | Kevin |
| PDF font embedding strategy | Phase 6 | Kevin |
| KB — Phase 7 read-only viewer, or defer entirely | Phase 6 exit | Kevin |
| Databricks cost alert threshold and recipient | Phase 10 | Kevin |

---

## 10. How to use this document

1. This file lives at `/docs/REBUILD_PLAN.md` and is the full reference.
2. At the start of each phase, re-read the relevant section.
3. At the end of each phase, update `PROGRESS.md` with what shipped and what's next.
4. Do not skip the exit criteria. If a phase isn't green, don't move on.
5. If an "Open question" becomes relevant before its target phase, answer it early. Don't defer thinking.
