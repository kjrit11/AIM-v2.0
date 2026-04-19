# Schema Reference — AIM v2

**Last updated:** 2026-04-18 (placeholder — populated in Phase 3)

This document is the canonical reference for table and column names in `sales.*`. It is **regenerated** from live `DESCRIBE TABLE` output, not hand-maintained. Never trust memory for a column name; check here.

---

## Status

This file is a placeholder during Phases 0–2. It will be populated in Phase 3 when the DB layer is built, via a script:

```bash
npm run schema:generate
```

That script will:
1. Connect to the dev Databricks warehouse.
2. For every table in `sales.core.*`, `sales.pricing.*`, `sales.notepad.*`, `sales.gold.*`, `sales.audit.*`: run `DESCRIBE TABLE`.
3. Format the output as Markdown and write to this file.
4. Include the warehouse name, catalog name, and generation timestamp at the top.

The generated file will be committed. Regenerate and commit whenever a migration changes a schema.

---

## Expected sections (populated in Phase 3)

- `sales.core.*` — pipeline, users, sessions, features, opportunities (post-rename)
- `sales.pricing.*` — segments, bands, modules, COGS, implementation schedules
- `sales.notepad.*` — notes, actions, attendees, summaries
- `sales.gold.*` — intelligence feeds
- `sales.audit.*` — audit trail

---

## Until Phase 3

If you need a column name before `schema:generate` exists:

1. Open the Databricks SQL editor.
2. Run `DESCRIBE TABLE sales.core.whatever`.
3. Copy the output. Use it.
4. If this happens more than three times, write the script.

---

## What about `sales.app.*`?

`sales.app.*` is the legacy schema from v1. It is **not referenced in v2 code**. See `/docs/ARCHITECTURE.md` § Database for the reasoning.

During Phases 0–9, `sales.app.*` tables still exist in Databricks (v1 reads them). After Phase 10 hard cutover, they may be dropped. That decision happens at cutover, not now.
