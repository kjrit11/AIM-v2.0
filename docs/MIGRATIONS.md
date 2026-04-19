# Migrations — AIM v2

**Last updated:** 2026-04-18

Schema changes are managed via versioned SQL files, not Alembic. See `/docs/ARCHITECTURE.md` § Migrations for why.

---

## File layout

```
migrations/
├── versions/
│   ├── 001_create_schema_migrations.sql       ← Wave 1
│   ├── 002_create_features_table.sql          ← Wave 1
│   ├── 003_drop_stale_industry_news_feed.sql  ← Wave 1
│   ├── 004_drop_empty_pricing_proposals.sql   ← Wave 1
│   ├── 005_rename_deals_to_opportunities_with_view.sql ← Wave 2 (Phase 3)
│   ├── 006_create_leads_table_and_migrate_prospects.sql ← Wave 2 (Phase 3)
│   ├── 007_migrate_proposals_to_core.sql      ← Wave 3 (Phase 6)
│   ├── 008_pricing_agent_schema.sql           ← Phase 4
│   └── ...
├── runner.ts                  ← Executed by CI (built in Phase 3)
└── README.md                  ← Points here
```

Each file is **numbered with three digits**, no gaps, no skips. Filenames use lowercase + underscores, ending in `.sql`. The number is immutable once merged to `main`.

See `/docs/WAVE_1_CLEANUP.md` for the one-time pre-Phase-1 cleanup batch (migrations 001–004).

---

## Tracking table

The runner relies on `sales.core.schema_migrations`, created in Wave 1 migration 001:

```sql
CREATE TABLE IF NOT EXISTS sales.core.schema_migrations (
  version    STRING NOT NULL,
  filename   STRING NOT NULL,
  applied_at TIMESTAMP NOT NULL,
  applied_by STRING NOT NULL,
  checksum   STRING NOT NULL
) USING DELTA;
```

Wave 1 migrations are hand-executed (the runner doesn't exist yet) and record themselves in the tracking table manually. From Phase 3 onward, the runner maintains this table automatically.

---

## Writing a migration

### Rules

1. **One logical change per file.** Don't combine "add column" and "backfill data" unless they're genuinely inseparable.
2. **Prefer additive changes.** Add columns, add tables, add indexes. Avoid destructive changes (drops, renames) unless necessary.
3. **Never edit a migration that's been merged to `main`.** If a migration was wrong, write a new migration that corrects it.
4. **Always include a rollback comment.** Even though we don't auto-execute down-migrations, documenting what it would take to reverse the change is required.
5. **Use `IF NOT EXISTS` and `IF EXISTS` liberally.** Runners can be retried after partial failures.

### Template

```sql
-- migrations/versions/NNN_short_description.sql
--
-- Purpose:    [one sentence]
-- Author:     [email]
-- Date:       YYYY-MM-DD
-- Rollback:   [plain-English description of how to reverse; or "destructive, no rollback"]
-- References: [link to PR, GOTCHAS entry, or Claude session transcript]

-- Actual SQL below.
CREATE TABLE IF NOT EXISTS sales.core.example (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- ...
) USING DELTA;
```

---

## Running migrations

### Wave 1 (hand-executed)

Wave 1 migrations 001–004 are executed in the Databricks SQL editor by hand, one at a time, with manual `INSERT` into the tracking table after each one succeeds. See `/docs/WAVE_1_CLEANUP.md` for the step-by-step procedure.

### Locally (dev catalog only, Phase 3+)

```bash
npm run migrate:dev
```

This runs the runner against `sales_dev.*` using the dev token from `.env.local`. It:

1. Connects to Databricks.
2. Reads `sales_dev.core.schema_migrations` to find the highest applied version.
3. For every file in `migrations/versions/` with a higher number: compute checksum, execute, record in tracking table.
4. If any file fails, stop. Do not continue.
5. If a file's checksum differs from a recorded checksum for the same version, fail loudly — someone edited a migration after merge.

### In CI (prod catalog, Phase 3+)

GitHub Actions workflow `.github/workflows/migrate.yml` runs on every push to `main`:

1. Authenticate to Databricks with the prod service principal.
2. Run the same runner against `sales.*`.
3. Fail the workflow if any migration fails. **Block the subsequent deploy workflow on this.**

The runner is idempotent — running it a second time with no new files is a no-op.

---

## Rollback

We do not auto-execute down-migrations. If a migration needs to be reversed:

1. **Identify the problem.** Is it data corruption, a broken query, or a blocking schema issue?
2. **If fixable forward:** write a new migration that corrects the issue. This is almost always the right answer.
3. **If a true rollback is needed:**
   - Use Delta time travel where possible: `RESTORE TABLE sales.core.whatever TO VERSION AS OF N`
   - For dropped tables: `UNDROP TABLE sales.schema.table` (works within retention window, default 30 days)
   - Hand-execute the reversal SQL documented in the original migration's `-- Rollback:` comment
   - Manually `DELETE FROM sales.core.schema_migrations WHERE version = 'NNN'` so the migration can be re-applied after a fix

Rollbacks happen under human supervision. The CI runner never rolls back.

---

## The rename: `sales.core.deals` → `sales.core.opportunities`

This is the first non-trivial migration after Wave 1. It lands in Phase 3 as migration 005.

### Strategy: rename + backwards-compat view

Because v1 (`kjrit11/SalesCommandCenter`) and v2 (`kjrit11/Aim-v2.0`) are separate repos on separate Container Apps both pointing at the same Databricks catalog, the cleanest approach is:

```sql
-- 005_rename_deals_to_opportunities_with_view.sql
--
-- Purpose:    Rename sales.core.deals to sales.core.opportunities,
--             with a view to keep v1 working until Phase 10 cutover.
-- Author:     kevin@careinmotion
-- Date:       (TBD — Phase 3)
-- Rollback:   DROP VIEW sales.core.deals;
--             ALTER TABLE sales.core.opportunities RENAME TO sales.core.deals;
-- References: docs/REBUILD_PLAN.md § Phase 3, § Phase 10

ALTER TABLE sales.core.deals RENAME TO sales.core.opportunities;

CREATE VIEW sales.core.deals AS
SELECT * FROM sales.core.opportunities;
```

### What this gets us

- v1 keeps reading `sales.core.deals` via the view — no v1 code changes needed.
- v2 reads `sales.core.opportunities` directly.
- v1 writes through the view (INSERT, UPDATE, DELETE) work because it's a simple 1:1 view with no transformations.
- A v1 user creates an opportunity → v2 sees it immediately, and vice versa. Single source of truth.
- At Phase 10 cutover: drop the view, v1 stops working (intentional).

### Caveats

- v1 and v2 share row-level data during Phases 3–10. A destructive bug in v1 could corrupt v2's data. Mitigation: revoke v1's Databricks write token at the end of Phase 5, making v1 read-only.
- Some Databricks SQL operations don't work the same through views as through tables (e.g., `MERGE INTO`, certain Delta-specific commands). v2 reads/writes the table directly, so this only matters if v1 uses these. v1 doesn't.
- The view is dropped at Phase 10 with `DROP VIEW sales.core.deals`. After that, v1's pages 500 immediately. This is the cutover signal.

### Same pattern applies to

- `sales.app.prospects` → `sales.core.leads` at migration 006 (Phase 3)
- `sales.app.proposals` + satellites → `sales.core.proposals` + satellites at migration 007 (Phase 6)

---

## Hard cutover at Phase 10 (Wave 4)

On cutover day:

1. Confirm v1 has been read-only since Phase 5 (Databricks write token revoked).
2. Run any final pending migrations.
3. Drop the backwards-compat views: `DROP VIEW sales.core.deals;` and all others — v1 stops working.
4. Drop remaining `sales.app.*` legacy tables that weren't migrated.
5. DNS / custom domain CNAME updated from v1 Container App to v2 Container App.
6. Watch Sentry + `/api/health` + logs for 2 hours.
7. If green: stop v1 Container App in Azure (do not delete yet).
8. After 7 days: delete v1 Container App, archive `kjrit11/SalesCommandCenter` on GitHub.

See `/docs/REBUILD_PLAN.md` § Phase 10 for the full cutover runbook.

---

## What NOT to do

- ❌ Don't edit a migration that's been merged.
- ❌ Don't skip numbers. `001, 002, 003` — never `001, 003, 004`.
- ❌ Don't combine unrelated changes into one migration.
- ❌ Don't write migrations that assume the DB is in a specific state. Always use `IF NOT EXISTS` / `IF EXISTS`.
- ❌ Don't run migrations manually against `sales.*` in production. CI only. (Exception: Wave 1, which runs before the runner exists.)
- ❌ Don't use Delta features (auto-optimize, Z-ordering) in migration files without testing in dev first.
- ❌ Don't drop the `sales.core.deals` view before Phase 10 — v1 depends on it.

---

## When migrations go wrong

- **Runner fails mid-file:** Delta transactions are atomic per statement, not per file. If a file has 3 statements and statement 2 fails, statement 1 is applied and 3 is not. The tracking table is NOT updated. Fix the failing statement, re-run.
- **Checksum mismatch:** Someone edited a migration after merge. Revert the edit. The file must match what was merged.
- **Runner can't reach Databricks:** Check the warehouse is running. Check the service principal token. Log to Sentry.

---

## Future considerations

- When the schema stabilizes, revisit whether Alembic (or a similar tool) has matured enough against Databricks to be worth the dependency.
- When we have more than one developer, add a PR check that verifies migration files follow the naming + numbering convention.
