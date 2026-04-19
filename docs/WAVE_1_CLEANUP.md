# Wave 1 Cleanup — Pre-Phase-1 Schema Migration

**Last updated:** 2026-04-18
**Runs:** Between Phase 0 (repo scaffold) and Phase 1 (design system)
**Owner:** Kevin Ritter
**Estimated time:** 30 minutes (10 min checks + 10 min execution + 10 min verification)

---

## Purpose

Before v2 code is written, remove known schema debt that is safe to clear. This prevents v2 code from accidentally depending on tables that are stale, empty, or duplicates.

**Scope:** Drops that don't break v1, plus creation of infrastructure tables v2 will need from Phase 3.

**Non-scope:** The rename of `sales.core.deals` → `sales.core.opportunities` and the prospects → leads migration. Those are Wave 2, handled in Phase 3 with backwards-compat views so v1 keeps working.

---

## What runs in Wave 1

| # | Operation | Target | Reason |
|---|---|---|---|
| 1 | CREATE | `sales.core.schema_migrations` | Tracking table for all future migrations |
| 2 | CREATE | `sales.core.features` | Feature flag storage (needed by Phase 3+) |
| 3 | DROP | `sales.app.industry_news_feed` | Stale duplicate — live data is in `sales.gold.industry_news_feed` |
| 4 | DROP | `sales.pricing.proposals` | Empty scaffold — live data is in `sales.app.proposals` |

**Four SQL files** go into `/migrations/versions/`. They are numbered 001–004.

**Note on what's NOT in Wave 1:** The initial audit (ARCHITECTURE.md) implied `sales.pricing.proposal_exports` and `sales.pricing.proposal_sections` existed as empty scaffolds. A pre-flight check on 2026-04-18 confirmed **those tables do not exist in Databricks at all**. The live `sales.app.proposal_exports` (13 rows) and `sales.app.proposal_sections` (38 rows) are real data — they migrate to `sales.core` at Phase 6 (Wave 3), not Wave 1.

---

## Pre-flight checks (MUST run before execution)

Run these queries against prod Databricks. Paste the results back before proceeding. Any surprise result stops Wave 1.

### Check 1 — Confirm stale table is stale

```sql
SELECT
  'app' AS schema,
  COUNT(*) AS rows,
  MAX(ingested_at) AS latest_ingest,
  MAX(published_at) AS latest_published
FROM sales.app.industry_news_feed
UNION ALL
SELECT
  'gold' AS schema,
  COUNT(*),
  MAX(ingested_at),
  MAX(published_at)
FROM sales.gold.industry_news_feed;
```

**Expected:** `app` row count ≤ `gold` row count, and `app.latest_ingest` is materially older than `gold.latest_ingest`. If `app` has been updated recently, STOP — something is still writing to it.

### Check 2 — Confirm empty scaffold is actually empty

```sql
SELECT 'sales.pricing.proposals' AS tbl, COUNT(*) AS rows FROM sales.pricing.proposals;
```

**Expected:** returns 0. If it returns >0, STOP and investigate — content appeared since the 2026-04-18 audit.

Also confirm the non-existence of what the audit implied (but which turned out not to exist):

```sql
SHOW TABLES IN sales.pricing LIKE 'proposal*';
```

**Expected:** only `proposals` appears. If `proposal_exports` or `proposal_sections` also appear, the audit from 2026-04-18 was wrong and those tables exist — STOP and inspect their row counts before continuing.

### Check 3 — Confirm no jobs write to the drop targets

In the Databricks UI:
1. Workflows → Jobs: search for "industry" and "proposal" — open each job that matches, inspect the notebooks/SQL for writes to `sales.app.industry_news_feed` and `sales.pricing.proposals`.
2. Unity Catalog → Lineage: for each drop target, view "Downstream" — confirm no pipelines or jobs consume them as inputs.
3. Delta Live Tables: check for any DLT pipelines touching these tables.

**Expected:** zero jobs, zero DLT pipelines, zero downstream lineage for each drop target. If anything is found, STOP — either redirect the job first or move that table out of Wave 1.

### Check 4 — Confirm the creation targets don't already exist

```sql
SHOW TABLES IN sales.core LIKE 'schema_migrations';
SHOW TABLES IN sales.core LIKE 'features';
```

**Expected:** both return empty. If either exists, STOP — a prior partial run or naming collision needs to be resolved first.

### Check 5 — Confirm current Databricks principal has the necessary privileges

```sql
SHOW GRANTS `<your-principal>` ON SCHEMA sales.core;
SHOW GRANTS `<your-principal>` ON SCHEMA sales.app;
SHOW GRANTS `<your-principal>` ON SCHEMA sales.pricing;
```

Needs: `CREATE TABLE` on `sales.core`, `DROP` on `sales.app` and `sales.pricing`.

**Expected:** grants show `ALL PRIVILEGES` or explicit `CREATE_TABLE` / `MODIFY` on each schema. If missing, get privileges before proceeding.

---

## Migrations (the actual SQL)

These are the final file contents. After pre-flight checks pass, commit these five files into `/migrations/versions/` in the new repo, then either:
- Run them locally against prod via `npm run migrate:prod` (once the runner exists — but Phase 3 builds the runner, so Wave 1 is hand-executed)
- Hand-execute them in the Databricks SQL editor in order, recording each in the tracking table as you go

### Hand-execution is fine for Wave 1

Wave 1 runs before the migration runner exists. Execute each migration's SQL block in the Databricks SQL editor, then after it succeeds, manually insert the tracking row.

---

### Migration 001 — Create tracking table

**File:** `migrations/versions/001_create_schema_migrations.sql`

```sql
-- migrations/versions/001_create_schema_migrations.sql
--
-- Purpose:    Bootstrap the migration tracking table.
-- Author:     kevin@careinmotion
-- Date:       2026-04-18
-- Rollback:   DROP TABLE sales.core.schema_migrations;
-- References: docs/MIGRATIONS.md, docs/WAVE_1_CLEANUP.md

CREATE TABLE IF NOT EXISTS sales.core.schema_migrations (
  version    STRING NOT NULL,
  filename   STRING NOT NULL,
  applied_at TIMESTAMP NOT NULL,
  applied_by STRING NOT NULL,
  checksum   STRING NOT NULL
) USING DELTA;

-- Manually record this migration's own application:
INSERT INTO sales.core.schema_migrations
VALUES ('001', '001_create_schema_migrations.sql', CURRENT_TIMESTAMP(), '<operator-email>', 'bootstrap');
```

Replace `<operator-email>` with Kevin's email. The `checksum` field can stay as `'bootstrap'` for Wave 1; the runner fills real checksums from Phase 3 forward.

---

### Migration 002 — Create features table

**File:** `migrations/versions/002_create_features_table.sql`

```sql
-- migrations/versions/002_create_features_table.sql
--
-- Purpose:    Feature flag storage. Consumed by /src/lib/features.ts from Phase 3.
-- Author:     kevin@careinmotion
-- Date:       2026-04-18
-- Rollback:   DROP TABLE sales.core.features;
-- References: docs/ARCHITECTURE.md § Feature flags

CREATE TABLE IF NOT EXISTS sales.core.features (
  key          STRING NOT NULL,
  enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  rollout_pct  INT NOT NULL DEFAULT 0,
  description  STRING,
  value        STRING,                          -- optional config value (e.g. email, threshold)
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  updated_by   STRING                            -- optional: who made the last change
) USING DELTA;

ALTER TABLE sales.core.features ADD CONSTRAINT pk_features_key PRIMARY KEY (key);

-- Seed the initial flags + config values
INSERT INTO sales.core.features (key, enabled, rollout_pct, description, value, updated_at, updated_by) VALUES
  ('demo_mode',              false, 0,   'When true, routes queries to sales_demo catalog',                 NULL, CURRENT_TIMESTAMP(), 'migration-002'),
  ('verbose_logging',        false, 0,   'When true, logger emits DEBUG-level entries',                     NULL, CURRENT_TIMESTAMP(), 'migration-002'),
  ('proposal_v2',            false, 0,   'Enables Phase 6 proposal generator UI',                           NULL, CURRENT_TIMESTAMP(), 'migration-002'),
  ('ai_task_extraction',     false, 0,   'Enables AI task extraction in Notepad Phase 8',                   NULL, CURRENT_TIMESTAMP(), 'migration-002'),
  ('pricing_approver_email', true,  100, 'Email address of the user authorized to approve below-floor pricing quotes',
                                         'kevin@careinmotion.com',
                                         CURRENT_TIMESTAMP(), 'migration-002');

INSERT INTO sales.core.schema_migrations
VALUES ('002', '002_create_features_table.sql', CURRENT_TIMESTAMP(), '<operator-email>', 'bootstrap');
```

**Note on the `value` column:** Most rows will have `value = NULL` — they're boolean feature flags toggled by `enabled`. The `value` column stores config-style data (emails, thresholds, arbitrary strings) for features that need a specific configurable value alongside the boolean. `pricing_approver_email` is the first such row (consumed by the Pricing Agent in Phase 4 per docs/modules/PRICING_AGENT.md § 6.7).

**Note on PRIMARY KEY:** Databricks Unity Catalog accepts `PRIMARY KEY` as an informational constraint (not enforced). It helps query planners and tools that introspect schema. If your Databricks runtime rejects the `ALTER TABLE ... ADD CONSTRAINT` syntax, drop that line — the table still works.

---

### Migration 003 — Drop stale industry_news_feed

**File:** `migrations/versions/003_drop_stale_industry_news_feed.sql`

```sql
-- migrations/versions/003_drop_stale_industry_news_feed.sql
--
-- Purpose:    Remove stale sales.app.industry_news_feed (79 rows, last updated
--             2026-03-25). Live intel data lives in sales.gold.industry_news_feed
--             (504 rows, daily updates as of 2026-04-18 audit).
-- Author:     kevin@careinmotion
-- Date:       2026-04-18
-- Rollback:   Delta time travel —
--             RESTORE TABLE sales.app.industry_news_feed TO VERSION AS OF <N>
--             — where N is the version prior to the drop. Time travel retention
--             on this table is 30 days by default.
-- References: docs/WAVE_1_CLEANUP.md, docs/GOTCHAS.md § "sales.app.industry_news_feed is stale"

DROP TABLE IF EXISTS sales.app.industry_news_feed;

INSERT INTO sales.core.schema_migrations
VALUES ('003', '003_drop_stale_industry_news_feed.sql', CURRENT_TIMESTAMP(), '<operator-email>', 'bootstrap');
```

---

### Migration 004 — Drop empty pricing.proposals

**File:** `migrations/versions/004_drop_empty_pricing_proposals.sql`

```sql
-- migrations/versions/004_drop_empty_pricing_proposals.sql
--
-- Purpose:    Remove empty scaffold sales.pricing.proposals. Live proposal data
--             is in sales.app.proposals (3 rows as of 2026-04-18 audit). The
--             sales.app.proposals → sales.core.proposals migration happens
--             in Phase 6; this migration only drops the empty duplicate in
--             sales.pricing.
-- Author:     kevin@careinmotion
-- Date:       2026-04-18
-- Rollback:   RESTORE TABLE sales.pricing.proposals TO VERSION AS OF <N>;
-- References: docs/WAVE_1_CLEANUP.md

DROP TABLE IF EXISTS sales.pricing.proposals;

INSERT INTO sales.core.schema_migrations
VALUES ('004', '004_drop_empty_pricing_proposals.sql', CURRENT_TIMESTAMP(), '<operator-email>', 'bootstrap');
```

---

## Execution order

1. **Hand-execute migration 001** in Databricks SQL editor. Verify `sales.core.schema_migrations` exists and has 1 row.
2. **Hand-execute 002.** Verify `sales.core.features` exists with 5 seed rows. Verify tracking table has 2 rows.
3. **Hand-execute 003.** Verify `sales.app.industry_news_feed` no longer shows in `SHOW TABLES IN sales.app`. Tracking table has 3 rows.
4. **Hand-execute 004.** Verify `sales.pricing.proposals` is gone. Tracking table has 4 rows.
5. **Run verification queries** (next section).
6. **Smoke-test v1** — log into the v1 Azure Container App, load the Overview page, load the Opportunities page, load the Industry News intel feed. Confirm nothing 500s.

---

## Post-flight verification

### Verify tracking table is populated

```sql
SELECT version, filename, applied_at FROM sales.core.schema_migrations ORDER BY version;
```

Expected: 4 rows, 001 through 004, in order.

### Verify features table seeded

```sql
SELECT key, enabled, value FROM sales.core.features ORDER BY key;
```

Expected: 5 rows — `ai_task_extraction`, `demo_mode`, `pricing_approver_email`, `proposal_v2`, `verbose_logging`. All `enabled = false` except `pricing_approver_email` which is `enabled = true` with `value = 'kevin@careinmotion.com'`.

### Verify drops succeeded

```sql
SHOW TABLES IN sales.app LIKE 'industry_news_feed';
SHOW TABLES IN sales.pricing LIKE 'proposal*';
```

Expected:
- First query returns empty (`sales.app.industry_news_feed` dropped).
- Second query returns empty (`sales.pricing.proposals` dropped; `proposal_exports` and `proposal_sections` never existed in `sales.pricing`).

### Smoke-test v1

Open the live v1 Azure Container App in a browser. Exercise:
- Overview page (loads without error)
- Opportunities list (loads without error)
- Leads list (loads without error)
- Industry News intel feed (loads without error — this is the one most at risk because it used to read a table that may have been either `sales.app` or `sales.gold`)

If v1's Industry News feed 500s, v1 was reading from `sales.app.industry_news_feed` after all, and the audit's assumption was wrong. Recovery: RESTORE the table from Delta time travel. Document the finding in GOTCHAS.md, and update v1's intel feed route to read from `sales.gold` (or accept v1 breakage of that page only).

---

## Rollback

If any Wave 1 migration goes wrong, or v1 breaks:

### Recovering a dropped table

Delta Lake keeps dropped tables' data for the default retention period (30 days on most Databricks workspaces). Recover with:

```sql
UNDROP TABLE sales.app.industry_news_feed;
-- or
UNDROP TABLE sales.pricing.proposals;
```

`UNDROP TABLE` works on managed tables within the retention window. Confirm retention settings with:

```sql
DESCRIBE DETAIL sales.app.industry_news_feed;
```

Look for `properties.delta.deletedFileRetentionDuration`.

If `UNDROP TABLE` doesn't work (e.g., retention expired, or it was an external table), the data is gone. For Wave 1 this shouldn't happen — all drop targets are recent and managed.

### Recovering tracking table

If `sales.core.schema_migrations` gets corrupted (e.g., duplicate version rows), manually clean up:

```sql
-- Find duplicates
SELECT version, COUNT(*) FROM sales.core.schema_migrations GROUP BY version HAVING COUNT(*) > 1;

-- If needed, reset the table (destructive)
DROP TABLE sales.core.schema_migrations;
-- Then re-run migration 001 and re-insert rows for the migrations that actually ran.
```

### Recovering features table

Easiest: drop it and re-run migration 002:

```sql
DROP TABLE IF EXISTS sales.core.features;
-- Then re-run 002.
DELETE FROM sales.core.schema_migrations WHERE version = '002';
```

---

## After Wave 1

- [ ] All 4 migrations succeeded; tracking table has 4 rows
- [ ] Features table seeded with 5 flags/config rows, `pricing_approver_email` enabled with Kevin's email, others disabled
- [ ] 2 drop targets confirmed gone (`sales.app.industry_news_feed`, `sales.pricing.proposals`)
- [ ] v1 smoke test green
- [ ] Update PROGRESS.md: add "Wave 1 cleanup complete" under Completed
- [ ] Update GOTCHAS.md: add any findings from the execution (e.g., if v1's Industry News feed broke, document the actual table it was reading). Note the pre-flight finding that `sales.pricing.proposal_exports/sections` never existed, correcting the initial audit.
- [ ] Commit the 4 migration files to `kjrit11/Aim-v2.0` main branch with message: `chore(migrations): Wave 1 schema cleanup — drop 2 stale/empty tables, create tracking + features`
- [ ] Proceed to Phase 1

---

## Notes for future waves

- **Wave 2** (Phase 3): `005_rename_deals_to_opportunities_with_view.sql` and `006_create_leads_table_and_migrate_prospects.sql`. Wave 2 migrations pick up from where Wave 1 left off.
- **Wave 3** (Phase 6): proposal data migration from `sales.app.*` to `sales.core.*` with backwards-compat views.
- **Wave 4** (Phase 10): drop all remaining backwards-compat views, drop remaining `sales.app.*` legacy tables, drop `password_hash` column.

**Version numbering note:** Wave 1 uses 001–004. Wave 2's `rename_deals_to_opportunities` becomes migration **005** and `create_leads_table_and_migrate_prospects` becomes **006**. Wave 3 (Phase 6 proposals) becomes **007**. Phase 4 Pricing Agent schema becomes migration **008**. Update REBUILD_PLAN.md and per-module specs accordingly once Wave 1 ships.
