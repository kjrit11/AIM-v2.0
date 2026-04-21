# Architecture — AIM v2

**Last updated:** 2026-04-18 (hosting decision, API-first design, Graph pre-provisioning integrated)

This document records architectural decisions and the reasoning behind them. Every stack choice in `CLAUDE.md` § Stack should have a corresponding entry here.

---

## Why we rebuilt

v1 accumulated debt that made forward motion slower than starting over:

- 84 unresolved TypeScript errors, mostly from missing type declarations.
- Two overlapping backends (Next.js API routes + FastAPI) with unclear boundaries.
- Loose SQL files with gaps (001–013, missing 011) instead of versioned migrations.
- `sales.app.*` legacy tables sitting alongside the correct schema-owner tables, with real data in both.
- Overview and Notepad pages rebuilt 4+ times each; each rebuild broke something else.
- No observability. No tests. No feature flags.
- Zero environment parity — "works locally, breaks in Azure" killed multiple sessions.

v2 is a clean rebuild of the application layer. The data layer is unchanged in structure — we're reusing what's in Databricks, with targeted migrations to fix known issues (rename deals → opportunities, disposition legacy tables).

---

## Decisions

### Frontend framework — Next.js 14 App Router

**Decision:** Keep Next.js 14 App Router. No Remix, no SvelteKit, no Astro.

**Reasoning:** The team knows it. Azure Container Apps deploys it cleanly. Server Components let us colocate DB queries with UI. The alternative would be a rewrite on an unfamiliar framework during an already-ambitious rebuild — not worth the risk.

---

### Backend — Next.js API routes only

**Decision:** Delete the FastAPI service. All AI calls and all API endpoints happen in Next.js.

**Reasoning:** v1's two-service architecture created seams where no seam was needed. Auth state had to be passed between them. Deploys had to stay in sync. CORS had to be configured. The only reason FastAPI existed was because the first AI agent was prototyped in Python. Three lines of TypeScript using `@anthropic-ai/sdk` replaces it.

---

### Database — Databricks Unity Catalog, nuanced schema disposition

**Decision:** Keep Databricks. Do NOT blanket-drop `sales.app.*` — several tables in it are live and authoritative. Instead, each `sales.app.*` table has one of three dispositions: **keep**, **migrate**, or **drop-at-Phase-10**.

**Reasoning:** A blanket "drop `sales.app.*`" plan was based on an incomplete picture. A schema audit on 2026-04-18 revealed:

- `sales.app.proposals` has 3 live rows; `sales.pricing.proposals` is empty (a scaffold).
- `sales.app.industry_news_feed` is stale (79 rows, 2026-03-25); `sales.gold.industry_news_feed` is live (504 rows, daily updates).
- `sales.app.kb_*` — Knowledge Base tables — contain real content (18 articles, 7 categories, 16 assets).

Full per-table disposition is below.

### Schema inventory with disposition

#### `sales.core` — canonical identity + pipeline data

| Table | Status | Disposition |
|---|---|---|
| `accounts` | Live | Keep, read from `sales.core.accounts` |
| `users` | Live | Keep. v1's `password_hash` column becomes unused after Entra SSO (Phase 2) — leave it in place, don't read it |
| `sessions` | Live | Keep. Still needed for session revocation on logout |
| `deals` | Live | Rename to `opportunities` at Phase 3 with backwards-compat view (see `docs/MIGRATIONS.md`) |
| `deal_users` | Live | **Keep and use.** Many-to-many deal ↔ user join. Has a `pricing_visibility` column (`Full` / partial / null) that controls whether each user on a deal can see margin and COGS data. Phase 5 (Opportunities) MUST join this. |

#### `sales.pricing` — pricing engine source of truth

All 16 tables + 2 views in `sales.pricing` are authoritative. Keep everything.

| Table | Notes |
|---|---|
| `segments`, `bands`, `band_pricing` | Core pricing config — 5 segments, 20 bands |
| `modules`, `module_pricing`, `module_cogs` | 13 modules with cost and revenue curves |
| `impl_schedules` | Implementation fee schedule |
| `discount_schedules` | Discount zone definitions |
| `quotes`, `quote_modules`, `deal_quotes` | Quote records |
| `benchmarks` | Currently empty; v1 Pricing Agent fell back to `bands.base_list_price_pu` |
| **`partner_contracts`** | **6 rows live. 16 columns.** Tracks vendor cost pass-throughs: `pricing_model`, `cost_per_unit`, `revenue_share_pct`, `min_commit_annual`, `tiers_json`, `auto_renews`. Relevant to Pricing Agent COGS calculation for partner-delivered components. v1 didn't use it. Phase 4 decision: whether to integrate it. |
| `proposals` | **Empty scaffold.** 0 rows. Dropped at Wave 1 (migration 004). Live proposal data is in `sales.app.proposals` + `sales.app.proposal_exports` + `sales.app.proposal_sections`, which migrate to `sales.core.*` at Phase 6. The originally-suspected satellites `sales.pricing.proposal_exports` and `sales.pricing.proposal_sections` **do not exist** in the catalog — verified via pre-flight `SHOW TABLES IN sales.pricing LIKE 'proposal*'` on 2026-04-18. |
| Views: `v_deal_profitability`, `v_module_margin` | Keep, consume in Phase 7 Overview and Phase 5 Opportunities |

#### `sales.notepad` — Notepad Agent source of truth

All 8 tables + 5 views are authoritative. Keep everything. v2 Notepad reads/writes the same tables.

#### `sales.gold` — intelligence feeds (read-only, written by Databricks agents)

| Table / View | Notes |
|---|---|
| `cms_policy_feed` | Live, daily |
| `industry_news_feed` | Live, daily (504 rows as of 2026-04-18). **Ignore the stale copy in `sales.app`.** |
| `competitor_intel_feed` | Live |
| `ai_vendor_intel_feed` | Raw table — do not query directly |
| `ai_vendor_intel_feed_v` | **View that normalizes competitor names to canonical vendors** (Epic, Oracle Health, Google, Microsoft, AWS, Databricks, Abridge, Suki, Nabla, Ambience). **Phase 7 queries this view, not the raw table.** |

#### `sales.integration` — Salesforce sync (out-of-band Databricks job)

Five tables that v1 did not touch but are live:

| Table | Likely role |
|---|---|
| `sf_accounts_raw` | Raw ingest from Salesforce accounts |
| `sf_accounts_curated` | Cleaned Salesforce accounts |
| `sf_opportunities_raw` | Raw ingest from Salesforce opportunities |
| `sf_opportunities_curated` | Cleaned Salesforce opportunities |
| `sync_runs` | Job execution log |

**Implication:** A Salesforce integration already exists, run by a Databricks job out-of-band. v2 has an open question for Phase 5 (or deferred): does `sales.core.accounts` get superseded by `sales.integration.sf_accounts_curated`? Or do they feed each other? **This needs to be answered with the owner of the Salesforce sync job before Phase 5.** Documenting as an open question, not a decision.

#### `sales.audit` — access logging

Two tables (`access_events`, `login_events`). Written via `writeAuditEvent()` helper. Keep as-is.

#### `sales.files` — Databricks Volumes (binary storage)

Three volumes: `deal_files_vol`, `proposals_vol`, `templates_vol`. Keep.

#### `sales.app` — legacy application schema

This is the messiest part. Per-table disposition:

| Table | Live? | Disposition |
|---|---|---|
| `agent_runs` | Check — may have real logs | Keep for Phase 3; write new agent logs to same table |
| `kb_articles` | Live, 18 rows | **Keep.** KB content exists. See § KB below. |
| `kb_assets` | Live, 16 rows | Keep |
| `kb_categories` | Live, 7 rows | Keep |
| `kb_subcategories` | Likely live | Keep |
| `kb_cache_metadata` | Likely scaffolding for a caching layer | Audit at Phase 7; drop if unused |
| `kb_feedback` | Likely empty | Keep (low cost) |
| `kb_objections` | Likely content | Keep |
| `kb_search_history` | Likely has rows | Keep |
| `prospects` | Live, canonical leads | **Migrate to `sales.core.leads` at Phase 3** (decision confirmed — see REBUILD_PLAN § Phase 3) |
| `prospect_notes` | Tied to prospects | Migrate with prospects |
| `prospect_strategy` | Tied to prospects | Migrate with prospects |
| `prospect_users` | Many-to-many (likely) | Migrate with prospects |
| `deal_file_content` | Live — extracted file text | Keep, read only. Consider moving to `sales.core` at Phase 10 |
| `deal_files` | File metadata | Keep, read only. Move to `sales.core` at Phase 10 |
| `deal_notes` | Live | Keep, read only |
| `deal_strategy` | Live | Keep, read only |
| `deal_workspace_summary` | AI-generated | Keep, regenerate in v2 |
| `industry_news_feed` | **Stale copy**, 79 rows | **Drop at Phase 10.** Never read in v2. |
| `proposals` | **Live, 3 rows** | **Keep, migrate to `sales.core.proposals` at Phase 6.** The matching `sales.pricing.proposals` is empty and will be dropped. |
| `proposal_assets`, `proposal_asset_links` | Tied to proposals | Migrate with proposals |
| `proposal_exports` | Tied to proposals | Migrate with proposals |
| `proposal_pricing_snapshot` | Critical — frozen pricing data | Migrate with proposals. Do not recalculate ever. |
| `proposal_sections` | Tied to proposals | Migrate with proposals |
| `proposal_source_snapshot` | Input data snapshot | Migrate with proposals |
| `proposal_style_guides` | Template config | Keep or migrate |
| `proposal_template_assets`, `proposal_templates` | Template library | Keep or migrate |
| `v_current_proposal_sections`, `v_margin_alerts`, `v_quote_summary` | Views | Recreate in target schema after migration |

**Default rule for v2 code:** read from `sales.core`, `sales.pricing`, `sales.notepad`, `sales.gold`. Only read from `sales.app` for explicitly listed exceptions (KB, legacy proposal data during Phase 6 migration).

**Phase 3 audit task:** run `COUNT(*)` on every `sales.app` table, confirm the disposition above, write up dispositions into `docs/SCHEMA.md` as the canonical per-table plan.

---

### Knowledge Base — scaffolded, real content exists

`sales.app.kb_*` tables contain 18 articles, 7 categories, 16 assets, plus search history and feedback. This is real content that v1 either never exposed in the UI or exposed minimally. v2 has two reasonable paths:

1. **Defer as originally planned** — build Phase 4–6 (revenue path) first. KB is a Phase 7+ consideration. The tables and content stay untouched.
2. **Promote to Phase 7** — build a minimal read-only KB viewer in Phase 7 alongside Overview. No write path in v2.1.

Default: **option 1 (defer)**. Revisit at Phase 6 exit.

See `docs/DEFERRED.md` for the updated rationale.

---

### Salesforce integration — acknowledged, not owned

`sales.integration.*` contains 5 tables from a live Salesforce sync job run in Databricks. v1 did not read or write these. Before Phase 5 (Opportunities) ships, we need to answer:

- Who owns the sync job? (Kevin to identify)
- Is `sales.core.accounts` a subset or superset of `sf_accounts_curated`?
- Should v2 read from `sf_accounts_curated` instead of `sales.core.accounts`?
- Are there write-back requirements (AIM creates an opp → Salesforce needs to know)?

Deferred to Phase 5 planning. Not a Phase 0 decision.

---

### Migrations — versioned SQL files, not Alembic

**Decision:** Numbered SQL files in `/migrations/versions/` with a `sales.core.schema_migrations` tracking table. A CI job runs pending migrations on merge to `main`.

**Reasoning:** Alembic's value is autogenerate (diff the model against the DB and produce a migration) and clean downgrade support. Neither works well against Databricks Unity Catalog:

- `databricks-sqlalchemy` has uneven DDL coverage for Unity Catalog features (managed vs external tables, column masks, row filters, tags, primary/foreign key declarations).
- Autogenerate diffs don't reliably detect Delta table properties, partitioning, or clustering.
- Downgrade migrations against Delta tables are rarely actually reversible without data loss.

The discipline we want (numbered files, no gaps, one file per change, reviewed in PR, run by CI) doesn't require Alembic. A lightweight SQL-file approach gets us there with one less dependency.

See `/docs/MIGRATIONS.md` for the full workflow.

---

### Auth — Databricks Apps native identity (x-forwarded-* headers)

**Decision:** Databricks Apps hosts the app and sits in front of it as an authenticating reverse proxy. The platform handles Entra/Databricks IdP login at its edge and forwards an already-authenticated request into the Next.js server with the user's identity encoded in `x-forwarded-*` headers. The app code never sees a login flow, never handles tokens, never stores a session.

**Reasoning:** Databricks Apps + Unity Catalog + on-behalf-of-user (OBO) tokens give us row-level authorization for free against the same IdP our users already use. NextAuth + a custom Entra app registration + Graph calls for group membership was 300+ lines of code and a deploy-day checklist item. Deleting it is unambiguously a win for an internal sales tool.

**Headers that arrive on every request:**

- `x-forwarded-email` — user's primary email (canonical identity key for joins against `sales.core.users.email`)
- `x-forwarded-user` — arrives as `{userId}@{workspaceId}`, NOT just `{userId}` (see `docs/GOTCHAS.md`). Parse with `.split('@')` — both halves are useful (userId for audit, workspaceId for scoping).
- `x-forwarded-preferred-username` — display-friendly username
- `x-forwarded-access-token` — user's OBO access token. Arrives on every request by default in our workspace (not OBO-consent-gated as docs suggest). Treat as sensitive: never log, never send to client, never store.

**Reading the user (server-side only):**

`src/lib/databricksUser.ts` exposes `getDatabricksUser()` / `requireDatabricksUser()`. In development the headers are absent (no Databricks proxy locally), so a hardcoded shim (`src/lib/devAuth.ts`) provides `dev@local.test`; the shim is dynamic-`require`d and tree-shaken out of prod bundles. See `scripts/dev-headers.md`.

**Defense-in-depth middleware:** `src/middleware.ts` rejects prod requests missing `x-forwarded-email` with a 401. The Databricks proxy is the primary enforcement point; this is a belt-and-braces guard against a misrouting bug.

**Role derivation: deferred.** Phase 2 is allow-any-authenticated-user. Phase 3 will derive roles via SCIM (app service principal reads group membership from Databricks SCIM endpoints) and cache them on `sales.core.users.role`. The old Graph API scope table is gone — we no longer need scopes like `User.Read`, `GroupMember.Read.All`, `Mail.Send`, etc.; anything that required those now flows through Databricks-issued tokens or through SCIM reads. Mail-sending features (Phase 6+) will revisit the auth path then.

**Open question for Phase 3:** reconciling `x-forwarded-email` with `sales.core.users.email` and the `owner_name` strings in `sales.core.deals`. Plan: on first request per user, match by email. If no match, auto-provision a row in `sales.core.users`.

---

### Access control — `deal_users.pricing_visibility` is load-bearing

**Decision:** Phase 5 (Opportunities) and Phase 4 (Pricing Agent when viewing a deal's quote) must check `sales.core.deal_users.pricing_visibility` before rendering margin, COGS, or discount percentage data.

**Reasoning:** The table exists with a per-user, per-deal visibility level. Values seen in audit: `Full`. Other values may exist (`Summary`, `None`, etc.) — to be confirmed in Phase 3 by `SELECT DISTINCT pricing_visibility FROM sales.core.deal_users`.

**Implication:** Pricing Agent isn't always shown in full. A user with `pricing_visibility = 'Summary'` on a deal sees total price but not margin bars or COGS breakdown. This is a real access-control requirement, not a display preference. Zod schemas for the deal API must include `pricingVisibility` in the response so the client can conditionally render.

---

### Partner contracts — pricing input, not yet wired

`sales.pricing.partner_contracts` has 6 live rows and a schema that suggests real vendor cost pass-through tracking (`revenue_share_pct`, `min_commit_annual`, `tiers_json`). v1 Pricing Agent didn't consume it — COGS came from seed files (`cogs.ts`, `modulePricing.ts`).

**Phase 4 decision:** Should Pricing Agent read `partner_contracts` and factor partner costs into COGS, or continue with seed files?

Default position: **continue with seed files in Phase 4**, flag `partner_contracts` integration as a Phase 4.5 enhancement. The seed-file approach is what we have working business logic for. Integrating `partner_contracts` is a scope increase that deserves its own pass.

---

### State management — React Query v5, TTLs centralized

See CLAUDE.md § Stack. Carried over from v1 — the pattern worked.

---

### Validation — Zod as single source of truth

Zod schemas in `/src/schemas/` drive both TypeScript types (via `z.infer`) and runtime validation.

---

### AI integration — one Anthropic SDK wrapper, one pattern

All AI calls route through `/src/lib/anthropic.ts`. One agent per file in `/src/lib/agents/`. Model: `claude-sonnet-4-6` from env var `ANTHROPIC_MODEL`.

---

### PDF generation — `@react-pdf/renderer`, separate component tree

PDF rendering uses a React component tree distinct from the HTML preview tree. They share a Zod schema for input data, not rendering components.

---

### Observability — Sentry + structured logs + query duration

- Sentry for client and server errors.
- Structured JSON logs with `{ request_id, user_id, route, level, message, ...context }`.
- Request ID middleware attaches a UUID to every incoming request.
- `executeQuery()` logs duration on every call. Queries >2s emit a Sentry breadcrumb.
- `/api/health` endpoint runs a tiny DB query and reports warehouse latency.

---

### Feature flags — DB table + hook, no commented-out code

`sales.core.features` table with `key, enabled, rollout_pct, description, updated_at`. `useFeature(key)` hook on the client. `getFeature(key, user)` on the server.

---

### Environments — three catalogs, one routing function

- `sales.*` — production. Shared with v1 until Phase 10 cutover (via the view-facade rename).
- `sales_dev.*` — dev. Mirrors `sales.*` schemas with safe-to-write data.
- `sales_demo.*` — demo. Seeded synthetic data.

`resolveCatalog(context)` in `/src/lib/db.ts` is the only place that logic lives.

---

### Testing — Playwright for critical flows, Vitest for everything else

- 5 Playwright flows on the revenue path.
- Vitest for unit and component tests, no cap.
- CI blocks merge on test failure.

---

### Component library — Storybook 8, stories before first use

Every primitive has a Storybook story before it's used in a page.

---

### Design tokens — TypeScript constants, enforced by lint

`/src/styles/tokens.ts` exports every color, space, radius, shadow, and motion value. ESLint `no-restricted-syntax` rule blocks hex values in `.tsx` files.

---

### Hosting — Databricks Apps (inverted from earlier decision)

**Decision:** Deploy to Databricks Apps. App name `aim-v2-dev`. Next.js 14 `output: 'standalone'` mode, served on Node 22.16 on the port Databricks injects as `DATABRICKS_APP_PORT`.

**This decision is inverted from the earlier Azure Container Apps plan.** The original reasoning rested on three constraints — a 30-second ingress timeout, Python-first platform assumptions, and a claim that we had no row-level access control need. A spike against the real Databricks Apps platform (2026-04-20) disproved the first two, and the third is weaker than it looked:

1. **The "30-second ingress timeout" was folklore.** The spike confirmed SSE streams survive 60+ seconds. None of AIM's AI workflows (note summary 30-60s, proposal 45-90s, pricing narrative 20-40s) are blocked by the platform.
2. **Next.js runs cleanly.** Node 22.16 is the default runtime; `output: 'standalone'` deploys straight to the platform. No Python-adjacent workaround needed. Custom middleware, App Router streaming, image optimization all work.
3. **Row-level access control is actually useful.** `sales.core.deal_users.pricing_visibility` gating is app-layer today, but OBO tokens (`x-forwarded-access-token`) let us push pricing visibility into Unity Catalog filters in future phases without rewriting the client.

**What we get by running on Databricks Apps:**

- **Identity for free.** Entra login handled at the platform edge. `x-forwarded-*` headers arrive pre-authenticated. No NextAuth, no custom Entra app registration, no Graph scope table, no role-derivation callback code. Deleted entirely.
- **Co-located with the data.** No cross-region hop between app and warehouse.
- **Managed secrets.** Databricks secret scopes (which can themselves be Azure Key Vault-backed) replace a separate Key Vault wiring.
- **Simpler deploy.** `databricks bundle deploy` + `databricks apps deploy` (see `docs/REBUILD_PLAN.md` § Phase 10). No container registry, no Dockerfile, no GitHub Actions workflow for image push.

**Trade-offs accepted:**

- **Mobile-client path is narrower.** Databricks Apps is a web-only runtime. A future mobile client would call a separate API surface (a different Databricks App or a companion service). Acceptable: mobile is already deferred to DEFERRED.md and a Phase 3+ conversation.
- **Platform lock-in is real.** If Databricks Apps pivots, pulls OBO from preview, or changes the header contract, we pay migration cost. Mitigations documented in `docs/DEFERRED.md` § OBO fallback.

**What we're hosting:**

- One app, `aim-v2-dev`, defined in `databricks.yml` bundle (target `dev`)
- Command surface: `app.yaml` at repo root — `node .next/standalone/server.js`, `PORT` from `DATABRICKS_APP_PORT`
- Postbuild static-copy script (`copy-static.js`) required because `output: 'standalone'` doesn't copy `.next/static` or `public/`
- See `docs/GOTCHAS.md` for seven spike-validated constraints (static-copy, split-on-@, auto-token, 7 env vars, bundle/manual conflict, deploy-is-two-steps, PowerShell stderr coloring)

---

### API-first design — every UI action has a clean endpoint

**Decision:** Every user-facing action in AIM is backed by a versioned REST endpoint under `/api/*` that could be called by a non-Next.js client. The Next.js app is the first consumer, not the only conceivable one.

**Reasoning:** The short-term benefit is discipline — API routes that are designed to be called from anywhere are better-factored than routes that assume a specific caller. Proper auth, proper validation, proper error responses, proper schemas. The long-term benefit is optionality: a mobile client, a Slack bot, an automation script, a partner integration — all become achievable without rewriting the core.

**What this means in practice:**

- **No "helper" endpoints that only make sense to one page.** If a page needs data, it calls a resource endpoint (`/api/opportunities/:id`), not an ad-hoc aggregator (`/api/pages/opportunity-detail`).
- **Zod schemas are the contract.** Request and response shapes are schema-first. The schema documents the API as authoritatively as the code.
- **Pagination, filtering, sorting are standardized.** Every list endpoint takes `?limit`, `?offset`, `?sort`, plus per-resource filters. No one-off query param naming.
- **Errors are structured.** `{ error: { code, message, details? } }` with stable error codes. Not HTML error pages, not free-text strings.
- **Versioning strategy.** We do NOT version URLs (`/api/v1/`). We version the Zod schemas themselves — breaking schema changes trigger a compatibility window where old and new clients are both served. Simpler than URL versioning for a small team with one primary client.
- **Authentication is token-based (session cookie for the web client, bearer tokens possible for future clients).** NextAuth's session cookie is a JWT; server-side session validation extracts the user without a DB call.

**What this rules out:**

- Server Actions as the exclusive mutation mechanism. Server Actions are fine for form submissions from the primary web client, but every Server Action has a corresponding `/api/*` route that does the same thing. The route is canonical; the Server Action is a convenience wrapper.
- Data fetched via Server Components without a corresponding API. If a Server Component renders `sales.core.opportunities`, there's also a `GET /api/opportunities` that returns the same data. Duplicative in one sense; disciplined in another.

**Trade-off accepted:** slightly more code per resource. A Next.js-only app could use Server Actions exclusively and save a layer. We pay that layer cost now to keep the door open.

### Mobile — deferred, but not abandoned

A React Native or PWA mobile client is on the radar but not in the v2 scope. The API-first architecture above preserves the option. No Phase is reserved for mobile. Kevin's explicit use case — marking tasks done from his phone during a meeting — will eventually be answered, but not in v2.

Documented as a DEFERRED entry rather than an open question, because the v2 decisions above already answer the "will this be possible later?" question with yes.

---

### Secrets — Databricks secret scopes

All secrets live in a Databricks secret scope (can be Azure Key Vault-backed). The app references them at deploy time through the bundle resource; no explicit runtime fetch code. Auto-injected Databricks env vars (`DATABRICKS_CLIENT_ID`, `DATABRICKS_CLIENT_SECRET`, etc. — see `docs/GOTCHAS.md`) are provided by the platform on every request.

---

## Open architectural questions

| Question | Decide by | Owner |
|---|---|---|
| Entra email ↔ `sales.core.users` reconciliation | Phase 2 | Kevin |
| Session timeout UX | Phase 2 | Kevin |
| Salesforce sync job ownership, write-back requirements, overlap with `sales.core.accounts` | Phase 5 | Kevin |
| `partner_contracts` integration into Pricing Agent COGS | Phase 4.5 (deferred) | Kevin |
| `pricing_visibility` distinct values (confirm enum) | Phase 3 | Kevin |
| KB — Phase 7 read-only viewer, or defer entirely | Phase 6 exit | Kevin |
| Anthropic rate-limit degradation UX | Phase 4 | Kevin |
| PDF font embedding strategy | Phase 6 | Kevin |
| Databricks cost alert threshold and recipient | Phase 10 | Kevin |
