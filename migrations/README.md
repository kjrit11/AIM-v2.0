# Migrations

See `/docs/MIGRATIONS.md` for the workflow.

## Wave 1 — applied 2026-04-19

- 001 · Create `sales.core.schema_migrations` tracking table
- 002 · Create `sales.core.features` config table with seed rows
- 003 · Drop stale `sales.app.industry_news_feed`
- 004 · Drop empty `sales.pricing.proposals` scaffold

All four were hand-executed against the `sales` catalog in Databricks on 2026-04-19.
Tracking table has 4 honest rows. See transcript for full execution history.
