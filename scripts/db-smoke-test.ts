/**
 * Databricks SQL smoke test — Phase 3a exit-criteria validation.
 *
 * Runs `SELECT 1 AS ok` through executeQuery(), prints the result and the
 * structured log line that executeQuery emits, and exits 0 on success.
 *
 * Usage:
 *   npx tsx scripts/db-smoke-test.ts
 *
 * The script loads .env.local itself (tiny inline parser) so no dotenv
 * dependency is introduced and no Node --env-file flag juggling is needed.
 *
 * Prereqs in .env.local (see docs/DEV_SETUP.md):
 *   ANTHROPIC_API_KEY            (any non-empty value is fine here)
 *   AIM_CATALOG                  (sales_dev recommended)
 *   DATABRICKS_SERVER_HOSTNAME
 *   DATABRICKS_HTTP_PATH
 *   DATABRICKS_WAREHOUSE_ID
 *   DATABRICKS_TOKEN             (PAT — preferred)
 *
 * This script is NOT part of the Next.js build. It is invoked manually by
 * Kevin with real credentials. CI does not run it.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvLocal() {
  const p = resolve(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  const text = readFileSync(p, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvLocal();

async function main() {
  // Lazy-import so env vars above are set before env.ts validation runs.
  const { executeQuery } = await import('../src/lib/db');
  const { withRequestContext } = await import('../src/lib/requestContext');

  const rows = await withRequestContext(
    { requestId: 'smoke-test', userEmail: 'smoke@local.test' },
    () => executeQuery<{ ok: number }>('SELECT 1 AS ok'),
  );
  // eslint-disable-next-line no-console
  console.log('Smoke test result:', rows);
  if (!rows.length || rows[0].ok !== 1) {
    throw new Error('Smoke test returned unexpected shape');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Smoke test failed:', err);
    process.exit(1);
  });
