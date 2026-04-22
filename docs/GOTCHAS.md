# Gotchas — AIM v2

**Last updated:** 2026-04-21 (Phase 2b platform pivot — seven Databricks Apps spike findings)

Running list of non-obvious things you need to know before touching specific tables, patterns, or integrations. Appended to at the end of every session where a new gotcha is discovered.

**Rule:** If you're tempted to rely on memory for a column name, a canonical value, a status enum, or an API quirk — check here first. If it's not here, add it once you've learned it.

---

## Format

Every entry follows this shape:

```
### [short title]
**Where:** [file / table / component / integration]
**Discovered:** YYYY-MM-DD
**Lesson:** [plain English — what you'd tell a new engineer]
**Reference:** [commit hash, PR link, or session ID]
```

---

## Schema audit findings (2026-04-18)

### `sales.core.deal_users.pricing_visibility` controls margin/COGS visibility
**Where:** `sales.core.deal_users`, Pricing Agent (Phase 4), Opportunities (Phase 5)
**Discovered:** 2026-04-18
**Lesson:** `deal_users` is a many-to-many between deals and users with a `pricing_visibility` column. Values observed include `Full`. Full enum to confirm in Phase 3 via `SELECT DISTINCT`. Pricing Agent must not render margin bars, COGS breakdown, or discount percentage unless the current user has `pricing_visibility = 'Full'` on the deal being viewed. Standalone Pricing Agent use (no deal context) shows everything to authenticated users by default. This is access control, not a UI preference — wire it into Zod response schemas.

### `sales.app.industry_news_feed` is stale; use `sales.gold.industry_news_feed`
**Where:** Intelligence feeds (Phase 7)
**Discovered:** 2026-04-18
**Lesson:** Two tables with the same name exist. The `sales.app` copy has 79 rows, last updated 2026-03-25. The `sales.gold` copy has 504 rows, updated daily. v1's intel ingestion writes to `sales.gold`. **Always read `sales.gold.industry_news_feed`.** The stale `sales.app` copy will be dropped at Phase 10.

### `sales.app.proposals` is live; `sales.pricing.proposals` is empty
**Where:** Proposal Generator (Phase 6)
**Discovered:** 2026-04-18
**Lesson:** The proposal data model lives in `sales.app.proposals` (3 live rows as of audit) and its satellite tables (`proposal_assets`, `proposal_sections`, `proposal_pricing_snapshot`, etc.). `sales.pricing.proposals`, `sales.pricing.proposal_exports`, and `sales.pricing.proposal_sections` exist but are empty scaffolds. v1 wrote to `sales.app`. Phase 6 migration (004+) moves these tables to `sales.core.proposals` and drops the empty `sales.pricing` copies.

### `sales.gold.ai_vendor_intel_feed_v` normalizes competitor names
**Where:** AI News intel feed (Phase 7)
**Discovered:** 2026-04-18
**Lesson:** `ai_vendor_intel_feed` is the raw table. `ai_vendor_intel_feed_v` is a view that adds a `vendor` column with canonical names (Epic, Oracle Health, Google, Microsoft, AWS, Databricks, Abridge, Suki, Nabla, Ambience) derived from lowercased substring matches on `competitor`. **Query the view, not the raw table.** If a new competitor needs canonical normalization, update the view's CASE expression rather than cleaning data in code.

### `sales.pricing.partner_contracts` — not consumed by v1 Pricing Agent
**Where:** Pricing Agent (Phase 4)
**Discovered:** 2026-04-18
**Lesson:** 6 live rows tracking vendor cost pass-throughs with `pricing_model`, `cost_per_unit`, `revenue_share_pct`, `min_commit_annual`, `tiers_json`. v1 Pricing Agent used seed files (`cogs.ts`, `modulePricing.ts`) instead. Phase 4 ships without `partner_contracts` integration to stay on the existing working logic. Integration is a separate Phase 4.5 scope decision.

### `sales.integration.*` — Salesforce sync, out-of-band
**Where:** `sales.integration` schema
**Discovered:** 2026-04-18
**Lesson:** 5 tables (`sf_accounts_raw`, `sf_accounts_curated`, `sf_opportunities_raw`, `sf_opportunities_curated`, `sync_runs`) populated by a Databricks job that v1 did not touch. Before Phase 5 (Opportunities), identify the sync job owner, confirm whether `sales.core.accounts` is a subset or replica of `sf_accounts_curated`, and decide whether v2 reads from one or the other (or both, with merge logic).

### Knowledge Base tables are populated
**Where:** `sales.app.kb_*`
**Discovered:** 2026-04-18
**Lesson:** 18 articles, 7 categories, 16 assets exist. v1 either didn't surface KB in the UI or surfaced it minimally. Phase 7+ decision: build a read-only viewer or defer entirely. Default is to defer. The tables stay where they are.

---

## Carried over from v1 (verified against new stack)

These gotchas were hard-won in v1 and still apply — the underlying DB and business logic hasn't changed.

### Databricks warehouse cold start is the primary source of perceived slowness
**Where:** Any `executeQuery()` call after idle period
**Discovered:** 2026-04 (v1)
**Lesson:** If a page feels slow on first load but fast on refresh, it's not the code — it's the warehouse waking up. Log query duration. Alert on >2s. Don't optimize the code; keep the warehouse warm or accept the cost.

### AI model string is `claude-sonnet-4-6` exclusively
**Where:** All AI calls via `/src/lib/anthropic.ts`
**Discovered:** 2026-04 (v1)
**Lesson:** Read the model from the `ANTHROPIC_MODEL` env var (defaulting to `claude-sonnet-4-6`). Never hardcode a different string. v1 had model strings drift across 8+ files and standardizing them took a full session.

### Pricing proposals must freeze pricing data at generation time
**Where:** Proposal generation flow (Phase 6)
**Discovered:** 2026-04 (v1)
**Lesson:** When a proposal is generated, the pricing snapshot is stored on the proposal record as `pricing_snapshot_json`. It is NEVER recalculated on view. Margin and discount percentages never appear in client-facing output. AI uplift is rendered as "Included."

### Pricing segment keys need normalization
**Where:** Pricing Agent calculation (Phase 4)
**Discovered:** 2026-04 (v1)
**Lesson:** The DB uses short segment codes (`payer`, `hs`, `aco`, `hie`, `cbo`). Seed data files and display code use full names (`Payer`, `Health System`, `ACO`, `HIE`, `Community Organization`). Route everything through a normalizer before any lookup. v1 had silent pricing failures for weeks because of this mismatch.

### Payer segment prices in PMPM, not annual
**Where:** Pricing Agent annual revenue calculation (Phase 4)
**Discovered:** 2026-04 (v1)
**Lesson:** Payer (health plan) prices are per-member-per-month. Annual revenue = rate × members × 12. All other segments are already annual (multiplier = 1). Store the multiplier in the segment config; never reconstruct from memory.

### No PHI exists in the system
**Where:** Overall data model
**Discovered:** 2026-04 (v1)
**Lesson:** AIM is a sales and operations tool. There is no patient-level data. Certain security findings (encryption-at-rest for PHI, HIPAA audit retention windows) don't apply. Don't over-engineer for a compliance regime that doesn't govern this data.

### All deletes are soft deletes
**Where:** All tables with an `is_deleted` column
**Discovered:** 2026-04 (v1)
**Lesson:** We never `DELETE FROM`. Set `is_deleted = true` and filter it out on read. This is across the board — notes, opportunities, leads, etc.

### `sales.core.deals.amount` is DOUBLE, not a dedicated money type
**Where:** `sales.core.deals` (→ `sales.core.opportunities` after Phase 3)
**Discovered:** 2026-04 (v1)
**Lesson:** It's a `DOUBLE`, which means floating-point rounding applies. For display, always format with two decimals. For comparison, tolerate tiny deltas. There's no dedicated currency type in Delta.

### Stage values on `sales.core.deals` are a closed enum
**Where:** `sales.core.deals.stage` (→ `sales.core.opportunities.stage`)
**Discovered:** 2026-04 (v1)
**Lesson:** Exactly these values exist: `Closed`, `Best Case`, `Pipeline`, `Qualified`, `Discovery`, `Omitted`. No `Closed Won`, no `Closed Lost`, no `Commit`, no `Upside`. `Omitted` is always excluded from metrics.

### `sales.core.deals.region` values
**Where:** Region filters and aggregations
**Discovered:** 2026-04 (v1)
**Lesson:** Values are `North America` and `International`. Not `Domestic`. Not `US`. Not `Intl`.

### Owner filtering: exact match on display name, never first-name ILIKE
**Where:** Anywhere filtering "my records"
**Discovered:** 2026-04 (v1)
**Lesson:** v1 had bugs where `ILIKE '%Kevin%'` matched multiple users. Use exact match on `owner_name`. The JWT carries the user's email; join against `sales.core.users.email` to get the canonical `display_name`, then match exactly. In v2, with `deal_users` in play, prefer the user_id join over owner_name matching entirely.

---

## v2-specific (accumulated as we build)

### `next/font/google` loads one family per import, mount both on `<html>`
**Where:** `src/app/layout.tsx`
**Discovered:** 2026-04-19 (Phase 2 dark indigo pivot)
**Lesson:** `next/font/google` is invoked once per family. To get Inter (sans) + JetBrains Mono (mono) both powering CSS variables, call both loaders at module scope and mount `inter.variable` and `jetbrainsMono.variable` together in the `<html>` `className`. Don't try to combine them into a single export — each call returns its own `.variable` class that scopes one CSS property (`--font-sans` and `--font-mono` in our case). Request only the weights you use (400 for body/mono, 500 for Inter headings) — requesting all weights doubles the download for no gain.

### Tailwind nested color keys generate `bg-bg-*` utilities
**Where:** `tailwind.config.ts` `theme.extend.colors`
**Discovered:** 2026-04-19 (Phase 2 dark indigo pivot)
**Lesson:** Defining `colors: { bg: { page: 'var(--bg-page)' } }` produces utilities like `bg-bg-page` (the outer `bg-` is Tailwind's background-color prefix, the inner `bg-page` is the color name). Likewise `text-text-primary`, `border-border-subtle`. Looks redundant but it's the intended shape — the alternative (flattening to `bg-page: { DEFAULT: 'var(...)' }` at the top level) loses the semantic grouping. Live with the doubled prefix; don't try to "fix" it by un-nesting.

### Semantic tokens ship as fg/bg pairs, never bare
**Where:** `src/app/globals.css`, `tailwind.config.ts`, all components using semantic colors
**Discovered:** 2026-04-19 (Phase 2 dark indigo pivot)
**Lesson:** Each semantic token (`success`, `warning`, `danger`, `info`) is a `{ fg, bg }` pair — there is no `bg-danger` or `text-danger` utility. Use `bg-danger-bg` + `text-danger-fg` together. The pair is the design contract: fg without bg reads as raw color, bg without fg reads as broken. An input's error border uses `border-danger-fg` (the fg carries outside the pair because a 1px line needs the punchy color); a badge uses both. When writing a new component, ask "is this a block or a line?" — blocks use the pair, lines use fg.

### NextAuth v5 `azure-ad` provider is a deprecated re-export — keep using it
**Where:** `src/auth.ts`, `next-auth/providers/azure-ad`
**Discovered:** 2026-04-19 (Phase 2)
**Lesson:** In `next-auth@5.0.0-beta.31`, `next-auth/providers/azure-ad` is marked `@deprecated` and re-exports the Microsoft Entra ID provider with `id: "azure-ad"` pinned. The non-deprecated `next-auth/providers/microsoft-entra-id` sets `id: "microsoft-entra-id"`. We import from the deprecated module specifically because our Azure app registration's redirect URI is `/api/auth/callback/azure-ad`; switching to the non-deprecated module would change the callback path and require re-registering in Azure (single-tenant admin consent included). Keep the pinned id until there's a reason to re-register. Live with the deprecation warning.

### Middleware matcher uses prefix match — `/designer`, `/design-tokens` would leak as public
**Where:** `src/middleware.ts`
**Discovered:** 2026-04-19 (Phase 2)
**Lesson:** The middleware matcher uses prefix match, so any future route starting with `/design` (e.g. `/designer`, `/design-tokens`) will be treated as public. When adding such a route, tighten the matcher OR rename the route. Same rule applies if anyone adds an `/authentication` route — the `auth` token in the negative lookahead matches it too. If the allowlist grows past three entries with ambiguous prefixes, switch from lookahead-excludes to explicit per-route gating in the `auth()` callback.

### `maxWidth['sign-in']: '400px'` is a layout constant, not a token
**Where:** `tailwind.config.ts`, consumed by `src/app/auth/signin/page.tsx` + `src/app/auth/error/page.tsx` + `src/app/page.tsx`
**Discovered:** 2026-04-19 (Phase 2)
**Lesson:** The `sign-in: '400px'` entry under `theme.extend.maxWidth` is a one-off layout constant for the auth card, not a general-purpose design token. It doesn't belong in `src/lib/tokens.ts` and shouldn't show up in the `/design` gallery. Accept it as the narrow exception to "tokens only" — the alternative would be `max-w-[400px]` arbitrary values in three places, which the same rule also bans. If the pattern keeps recurring (a second "narrow centered card" screen lands with a different width), promote both to a shared token like `card-narrow` — but don't preemptively generalize. Rule: **one-off → stays a layout constant; two-off → becomes a token.**

### Claude Code worktrees inherit ESLint config from parent directories
**Where:** `.eslintrc.json` in every worktree under `.claude/worktrees/*`
**Discovered:** 2026-04-19 (Phase 2)
**Lesson:** When Claude Code creates a worktree under `.claude/worktrees/<name>/`, ESLint walks upward looking for configs and picks up the parent repo's `.eslintrc.json` as well as the worktree's copy — causing a `Plugin "@next/next" was conflicted between ...` error and exit code 1. Fix by adding `"root": true` to the worktree's `.eslintrc.json` so ESLint stops climbing. Do this once per worktree (or bake it into the main `.eslintrc.json` so all future worktrees inherit correctly). Symptom-to-cause: any lint error that mentions two `.eslintrc.json` paths in the plugin conflict message is this.

### NextAuth JWT type augmentation must target `@auth/core/jwt`, not `next-auth/jwt`
**Where:** `src/types/next-auth.d.ts`
**Discovered:** 2026-04-19 (Phase 2)
**Lesson:** `next-auth/jwt` in v5 is a pure re-export (`export * from "@auth/core/jwt"`), so `declare module 'next-auth/jwt' { interface JWT {...} }` is a no-op — the interface lives in `@auth/core/jwt` and must be augmented there. Symptom when wrong: `token.given_name` and other augmented fields resolve to `{} | null` or `unknown` (falling back to the `Record<string, unknown>` index signature JWT extends), not the `string | null` you declared. The `Session` augmentation via `declare module 'next-auth'` DOES work at the re-export level because `next-auth`'s own types define Session; only JWT requires drilling to `@auth/core/jwt`. Check the augmentation is live with a quick `const x: typeof token.given_name = null` — if TS accepts that and refuses `null as string | null`, the augmentation path is wrong.

### `auth()` helper has dual role — session reader AND middleware
**Where:** `src/auth.ts`, `src/middleware.ts`, any RSC calling `auth()`
**Discovered:** 2026-04-19 (Phase 2)
**Lesson:** In NextAuth v5, the same `auth` export from `NextAuth({...})` serves two roles: (a) imported by a Server Component or route handler, it reads the current session (`const session = await auth()`); (b) re-exported from `src/middleware.ts` as `export { auth as middleware }`, it runs as edge middleware with different call semantics (takes a `NextRequest`, returns a redirect/rewrite). Same symbol, different runtime. When debugging middleware, remember the auth helper is running in the Edge runtime — `process.env` reads work but node-only APIs don't, so anything `src/auth.ts` imports transitively (like `src/lib/env.ts` with Zod) must be Edge-compatible. Zod is fine; Databricks SQL client won't be — so don't pull DB code into the auth graph until we split data access out of the middleware path.

### Dropping a design token = multi-file rename, not a delete
**Where:** `src/app/globals.css`, `tailwind.config.ts`, `src/lib/tokens.ts`, all components, docs/STYLE_GUIDE.md, docs/GOTCHAS.md
**Discovered:** 2026-04-19 (Phase 1.5 text-tier collapse)
**Lesson:** When a token is removed from the locked system, grep every `.md`, `.tsx`, `.ts`, and `.css` file for references before removing the CSS variable. Dropping the variable first produces dangling `var(--foo)` that silently fall back to inherited or invalid values at runtime — no compile-time error, no ESLint warning. Always: grep → map old→new per site → apply renames → then drop the variable. For doc-example references and primitive consumers, map semantics deliberately (a `text-strong` removal is not a mechanical `text-body` rename — the old site may have meant "darker than body," which in a 3-tier system resolves to either `text-body font-medium` or `text-text-primary` depending on context). Flag individual call sites for review rather than bulk-replacing.

---

## Databricks Apps platform findings (2026-04-20 spike)

### `output: 'standalone'` does not copy static assets
**Where:** `next.config.mjs`, `copy-static.js`, `package.json` build script
**Discovered:** 2026-04-20
**Lesson:** Next.js `output: 'standalone'` produces `.next/standalone/server.js` but does NOT copy `.next/static/` or `public/` into the standalone tree. The server starts, then 404s every static asset. Fix: a postbuild script (`copy-static.js`) using Node's `fs` module to recursively copy both directories. Do not use shell commands (`cp -r`) — Databricks build infra is Linux but Windows dev machines need the same script to work locally, and Node `fs` is portable.

### `x-forwarded-user` is `{userId}@{workspaceId}`, not just `{userId}`
**Where:** `src/lib/databricksUser.ts`
**Discovered:** 2026-04-20
**Lesson:** The spike expected `x-forwarded-user` to contain just the IdP user ID. It actually arrives as `{userId}@{workspaceId}` — e.g. `abc123@7890def`. Parse with `.split('@')`. Both halves are useful: userId for audit log stability (survives workspace migrations), workspaceId for future multi-workspace scoping of queries. Don't throw away the workspace half.

### `x-forwarded-access-token` arrives by default, not via OBO consent
**Where:** `src/lib/databricksUser.ts`, anywhere that logs request headers
**Discovered:** 2026-04-20
**Lesson:** Databricks Apps docs suggest `x-forwarded-access-token` only arrives after an explicit OBO (on-behalf-of-user) consent flow. In our workspace it arrives on every request, by default, in Phase 2. Treat it as sensitive from day one: never log it, never send it to the browser, never write it to analytics. The header is a user-impersonating access token.

### Databricks Apps auto-injects 7 env vars + `NEXT_DEPLOYMENT_ID`, not 3
**Where:** `src/lib/env.ts`, anything that reads `process.env.DATABRICKS_*`
**Discovered:** 2026-04-20
**Lesson:** Databricks docs mention "a few" auto-injected env vars and show 3 examples. Actual count is 8: `DATABRICKS_APP_NAME`, `DATABRICKS_APP_PORT`, `DATABRICKS_APP_URL`, `DATABRICKS_CLIENT_ID`, `DATABRICKS_CLIENT_SECRET`, `DATABRICKS_HOST`, `DATABRICKS_WORKSPACE_ID`, and `NEXT_DEPLOYMENT_ID`. All absent in local dev; all present in prod. Declare them as optional in the Zod schema (`.optional()`) — crashing the dev server because Databricks-injected vars aren't set is a footgun.

### Bundle deploy vs manual `databricks apps create` → Terraform state conflict
**Where:** `databricks.yml`, deploy workflow (Phase 10)
**Discovered:** 2026-04-20
**Lesson:** Creating an app manually with `databricks apps create aim-v2-dev` and then running `databricks bundle deploy` against a `databricks.yml` that declares the same app resource produces a Terraform state conflict: "An app with the same name already exists." The bundle owns Terraform state; manual `apps create` does not. Pick one pattern and stick with it. **We use bundles only.** If an app was manually created, delete it before the first bundle deploy.

### `databricks bundle deploy` provisions, does NOT deploy code
**Where:** Phase 10 deploy workflow, `docs/REBUILD_PLAN.md` Phase 10
**Discovered:** 2026-04-20
**Lesson:** `databricks bundle deploy` creates/updates the app resource (Terraform-style) but does NOT trigger a code deployment. The first time, you'll see the app listed in the Databricks UI but hitting its URL returns an error because no code is deployed. Explicit second step required: `databricks apps deploy <name> --source-code-path /Workspace/Users/.../.bundle/<bundle-name>/<target>/files`. Both commands are needed on every deploy. Easy to script, easy to forget.

### Databricks CLI 0.297.2 stderr appears as red errors in PowerShell
**Where:** Dev ergonomics only (no production impact)
**Discovered:** 2026-04-20
**Lesson:** Databricks CLI v0.297.2 writes informational/progress output to stderr, which PowerShell wraps in red `ErrorRecord` objects with `NativeCommandError` metadata — looks like everything failed even when exit code is 0. Pipe through `2>&1 | Out-String` for readable output, or check `$LASTEXITCODE` explicitly. Cosmetic issue; does not affect actual behavior. Don't waste time debugging a "failure" that's just stderr coloring.

---

## Phase 3a — data layer foundation (2026-04-22)

### AsyncLocalStorage is Node-runtime-only
**Where:** `src/lib/requestContext.ts`, `src/middleware.ts`, `src/app/(app)/layout.tsx`
**Discovered:** 2026-04-22
**Lesson:** `node:async_hooks` (and therefore `AsyncLocalStorage`) is not reliably available on the Edge runtime. Middleware runs on Edge, so it cannot bind request-scoped values via ALS itself. The pattern instead:
1. Middleware generates a request ID and stamps it on the incoming request headers with `NextResponse.next({ request: { headers } })`, plus on the response headers for client correlation.
2. Node-runtime boundaries (route handlers, the `(app)` layout — anything that calls into `executeQuery` / `logger`) read `x-request-id` from `headers()` and wrap their work in `withRequestContext({ requestId, userEmail }, fn)`.
3. `logger.ts` and `executeQuery()` read the bound context via `getContext()`.
Do not try to call `als.run()` or `als.enterWith()` from middleware — even if it compiles, the Edge runtime's async context does not propagate into the downstream Node handler, so consumers would see `undefined`. Set the request ID via request-header pass-through and let the Node side own the ALS binding.

---

## How to add an entry

1. End of session, before committing: did I learn something that's not obvious from the code?
2. If yes, append an entry here using the format above.
3. Commit this file in the same commit as the code change.
4. In code comments, reference the gotcha: `// See docs/GOTCHAS.md § [title]`.

The test for whether something is a gotcha: *would a competent engineer looking at this code a month from now guess wrong?* If yes, it's a gotcha.

### `@databricks/sql` internal type import

The SDK does not re-export `IDBSQLClient` from its package root. `src/lib/db.ts`
imports it via a `dist/contracts/` internal path. Type-only import — a future
SDK version that moves the file breaks at typecheck, not silently at runtime.
If a version bump fails to import: check `node_modules/@databricks/sql/dist/`
for the new type location.