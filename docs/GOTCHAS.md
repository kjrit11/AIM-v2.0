# Gotchas — AIM v2

**Last updated:** 2026-04-19 (Phase 2 dark indigo pivot — next/font dual-family, Tailwind `bg-bg-*` nesting, semantic pair rule)

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

### Dropping a design token = multi-file rename, not a delete
**Where:** `src/app/globals.css`, `tailwind.config.ts`, `src/lib/tokens.ts`, all components, docs/STYLE_GUIDE.md, docs/GOTCHAS.md
**Discovered:** 2026-04-19 (Phase 1.5 text-tier collapse)
**Lesson:** When a token is removed from the locked system, grep every `.md`, `.tsx`, `.ts`, and `.css` file for references before removing the CSS variable. Dropping the variable first produces dangling `var(--foo)` that silently fall back to inherited or invalid values at runtime — no compile-time error, no ESLint warning. Always: grep → map old→new per site → apply renames → then drop the variable. For doc-example references and primitive consumers, map semantics deliberately (a `text-strong` removal is not a mechanical `text-body` rename — the old site may have meant "darker than body," which in a 3-tier system resolves to either `text-body font-medium` or `text-text-primary` depending on context). Flag individual call sites for review rather than bulk-replacing.

---

## How to add an entry

1. End of session, before committing: did I learn something that's not obvious from the code?
2. If yes, append an entry here using the format above.
3. Commit this file in the same commit as the code change.
4. In code comments, reference the gotcha: `// See docs/GOTCHAS.md § [title]`.

The test for whether something is a gotcha: *would a competent engineer looking at this code a month from now guess wrong?* If yes, it's a gotcha.
