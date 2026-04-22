# Dev setup — AIM v2

**Last updated:** 2026-04-22 (Phase 3a)

Companion to `scripts/dev-headers.md`. That file covers how to simulate Databricks Apps `x-forwarded-*` headers locally; this one covers the rest of the local-dev environment — Databricks SQL credentials, catalog routing, and Sentry stub behavior.

---

## 1. Databricks personal access token (PAT)

Local dev talks to the same Databricks workspace as prod. Generate a PAT against the workspace you want to target (typically the dev workspace):

1. Open the Databricks workspace UI.
2. Top-right avatar → **User Settings**.
3. Left nav → **Developer** → **Access tokens** → **Generate new token**.
4. Set a short-ish lifetime (e.g. 90 days — or whatever your workspace policy permits) and a descriptive comment (`aim-v2 local dev`).
5. Copy the token immediately. Databricks does not show it again.

TODO: document the workspace's token expiry policy once confirmed.

Put the token in `.env.local`:

```env
DATABRICKS_TOKEN=dapi...
DATABRICKS_SERVER_HOSTNAME=adb-<workspace>.<n>.azuredatabricks.net
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/<warehouse-id>
DATABRICKS_WAREHOUSE_ID=<warehouse-id>
```

`DATABRICKS_TOKEN` is preferred for local dev. When it is absent, `src/lib/db.ts` falls back to `DATABRICKS_CLIENT_ID` + `DATABRICKS_CLIENT_SECRET`, which are auto-injected by Databricks Apps in production and should generally not be filled in locally.

---

## 2. Catalog routing (`AIM_CATALOG`)

`AIM_CATALOG` is **required**. It is the only thing `resolveCatalog()` reads in `src/lib/db.ts`, and it decides which Unity Catalog catalog every query hits:

| Value | Use |
|---|---|
| `sales` | Production |
| `sales_dev` | Local / dev deployments |
| `sales_demo` | Demo-mode seed dataset (Phase 9) |

For local dev, put this in `.env.local`:

```env
AIM_CATALOG=sales_dev
```

Missing or empty → the process crashes at env validation. That is intentional. Silent defaulting to `sales` is a production-data hazard we are not taking.

---

## 3. Sentry stub behavior

`SENTRY_DSN` is optional in Phase 3a. The Sentry project has not been provisioned yet. When the env var is unset:

- `src/instrumentation.ts` skips the `Sentry.init()` call entirely.
- `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts` all guard on `SENTRY_DSN` and no-op.
- `executeQuery()`'s slow-query breadcrumb code wraps the Sentry call in a `try/catch` so an import failure does not crash the request.

All normal logging still works — `log.info / warn / error / debug` writes structured JSON to stdout via `src/lib/logger.ts`. That is the Phase 3a observability surface; Sentry is additive.

Once a Sentry project exists, add `SENTRY_DSN` to the Databricks secret scope and to `.env.local`. No code change required.

---

## 4. Running the smoke test

`scripts/db-smoke-test.ts` is the Phase 3a exit-criteria validation. It imports `executeQuery()` and runs `SELECT 1 AS ok`, printing the result and the structured log line. Run it after wiring your `.env.local`:

```bash
npx tsx scripts/db-smoke-test.ts
```

(If `tsx` is not installed, `npx tsx` will fetch it on demand — no global install required.)

A successful run exits 0 and prints a row containing `{ ok: 1 }`. Any other exit code means either credentials are wrong, the warehouse is asleep (the first run after idle takes longer — see `docs/GOTCHAS.md` § "Databricks warehouse cold start"), or network egress is blocked.

---

## 5. What NOT to do locally

- Do not set `AIM_CATALOG=sales` in `.env.local`. Production-catalog access from a developer laptop has no upside and a lot of downside.
- Do not commit `.env.local`. It is gitignored by default; double-check before you stage.
- Do not paste PATs into Slack, email, or PR descriptions. Regenerate if one leaks.
