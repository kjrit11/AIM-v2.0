/**
 * Migration runner — AIM v2 (Phase 3b)
 * ====================================
 *
 * Applies pending SQL files from migrations/versions/ against the catalog
 * configured in .env.local. Manual execution only:
 *
 *   npx tsx scripts/migrate.ts
 *
 * Guarantees:
 *   - One statement per file (enforced by convention; runner passes file
 *     contents directly to executeQuery).
 *   - Dedup key is FILENAME — multiple 005a/005b/005c files share a version
 *     string but each gets its own tracking row.
 *   - Filename shape /^\d{3}[a-z]?_[a-z0-9_]+\.sql$/. Non-matching .sql files
 *     fail the run — a typo should not silently become "nothing applied."
 *   - SHA-256 hex digest recorded on insert. Pre-existing Wave 1 rows keep
 *     their 'bootstrap' checksum (grandfathered, not recomputed).
 *   - On apply failure: log + exit 1, WITHOUT recording in schema_migrations.
 *
 * Auth: reuses the .env.local PAT via src/lib/db.ts. Prod SP is expected to
 * lack DDL privilege, so this runner is NOT wired into deploy.
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Inline .env.local parser — same pattern as scripts/db-smoke-test.ts so
// this script has no additional dependencies (no dotenv).
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

const FILENAME_RE = /^\d{3}[a-z]?_[a-z0-9_]+\.sql$/;

function resolveAppliedBy(): string {
  const who = process.env.USER || process.env.USERNAME || 'unknown';
  if (process.env.DATABRICKS_TOKEN) return `pat:${who}`;
  if (process.env.DATABRICKS_CLIENT_ID) return `sp:${who}`;
  return who;
}

async function main() {
  // Lazy-import so env vars set by loadEnvLocal() above are in place before
  // env.ts Zod validation runs.
  const { executeQuery, qualifiedName, TABLES } = await import('../src/lib/db');
  const { withRequestContext } = await import('../src/lib/requestContext');

  const migrationsDir = resolve(process.cwd(), 'migrations', 'versions');
  const migrationsTable = qualifiedName('core', TABLES.SCHEMA_MIGRATIONS);
  const appliedBy = resolveAppliedBy();

  await withRequestContext(
    { requestId: 'migrate', userEmail: appliedBy },
    async () => {
      // Step 1: ensure tracking table exists. IF NOT EXISTS keeps this
      // idempotent against fresh catalogs. In our case the table already
      // exists (migration 001 created it in Wave 1) — this is defensive.
      await executeQuery(
        `CREATE TABLE IF NOT EXISTS ${migrationsTable} (
           version    STRING NOT NULL,
           filename   STRING NOT NULL,
           applied_at TIMESTAMP NOT NULL,
           applied_by STRING NOT NULL,
           checksum   STRING NOT NULL
         ) USING DELTA`,
      );

      // Step 2: read current state.
      const rows = await executeQuery<{ filename: string }>(
        `SELECT filename FROM ${migrationsTable}`,
      );
      const applied = new Set(rows.map((r) => r.filename));

      // Step 3: enumerate local files.
      const allFiles = readdirSync(migrationsDir)
        .filter((f) => f.toLowerCase().endsWith('.sql'))
        .sort();

      for (const f of allFiles) {
        if (!FILENAME_RE.test(f)) {
          // eslint-disable-next-line no-console
          console.error(
            `✗ Migration filename does not match /^\\d{3}[a-z]?_[a-z0-9_]+\\.sql$/: ${f}`,
          );
          process.exit(1);
        }
      }

      const pending = allFiles.filter((f) => !applied.has(f));

      if (pending.length === 0) {
        // eslint-disable-next-line no-console
        console.log(
          `No pending migrations. ${applied.size} already applied.`,
        );
        return;
      }

      // Step 4: apply each pending migration.
      let appliedThisRun = 0;
      for (const filename of pending) {
        const filepath = resolve(migrationsDir, filename);
        const contents = readFileSync(filepath, 'utf8');
        const checksum = createHash('sha256').update(contents).digest('hex');
        const version = filename.slice(0, 3); // STRING, matches schema_migrations.version column type

        // eslint-disable-next-line no-console
        console.log(`Applying ${filename}...`);

        try {
          await executeQuery(contents);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          // eslint-disable-next-line no-console
          console.error(`✗ Failed ${filename}: ${msg}`);
          // eslint-disable-next-line no-console
          console.log(
            `\nSummary: ${appliedThisRun} applied this run, ${
              applied.size + appliedThisRun
            } total before failure.`,
          );
          process.exit(1);
        }

        await executeQuery(
          `INSERT INTO ${migrationsTable}
             (version, filename, applied_at, applied_by, checksum)
           VALUES (?, ?, CURRENT_TIMESTAMP(), ?, ?)`,
          [version, filename, appliedBy, checksum],
        );

        // eslint-disable-next-line no-console
        console.log(`✓ Applied ${filename}`);
        appliedThisRun += 1;
      }

      // eslint-disable-next-line no-console
      console.log(
        `\nSummary: ${appliedThisRun} applied this run, ${
          applied.size + appliedThisRun
        } total.`,
      );
    },
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Migration runner failed:', err);
    process.exit(1);
  });
