/**
 * Databricks SQL data layer — AIM v2 (Phase 3a)
 * =============================================
 *
 * Single entry point for all Databricks access. Per CLAUDE.md:
 *   Rule #1  — all DB access through executeQuery()
 *   Rule #11 — table/view names come from constants here, never hardcoded
 *   Rule #12 — parameterized queries only; NEVER interpolate user input
 *   Rule #14 — query duration logged on every call; >2s warns
 *
 * Parameterization:
 *   Callers pass `?` placeholders in `sql` and values in the `params` array.
 *   The wrapper rewrites `?` to the SDK's named-parameter form
 *   (:param_1, :param_2, ...). If you feel tempted to string-concatenate
 *   user input into `sql`, stop. Use a parameter.
 *
 * Connection:
 *   One DBSQLClient for the process lifetime, opened lazily on first call.
 *   Each query opens and closes its own session (cheap relative to the
 *   statement's latency). Auth prefers DATABRICKS_TOKEN (PAT, dev-friendly);
 *   falls back to DATABRICKS_CLIENT_ID + DATABRICKS_CLIENT_SECRET (the
 *   service principal auto-injected by Databricks Apps in prod).
 *
 * Server-only. Do not import from client components.
 */

import { DBSQLClient } from '@databricks/sql';
// NOTE: IDBSQLClient is imported from an internal `dist/contracts` path
// because @databricks/sql does not re-export the interface from its package
// root. Type-only import so this is stripped at compile time; a future SDK
// that moves the file will break at typecheck rather than silently at
// runtime. See docs/GOTCHAS.md § "@databricks/sql internal type import".
import type IDBSQLClient from '@databricks/sql/dist/contracts/IDBSQLClient';
import { env } from './env';
import { log } from './logger';

// ─── Table / view name constants (CLAUDE.md Rule #11) ─────────────────

export const TABLES = {
  OPPORTUNITIES: 'opportunities',
  USERS: 'users',
  FEATURES: 'features',
  SCHEMA_MIGRATIONS: 'schema_migrations',
} as const;

// Populated in Phase 3b when migration 005 adds the `deals` compatibility view.
export const VIEWS = {} as const;

// ─── Catalog routing ──────────────────────────────────────────────────

/**
 * Returns the configured catalog (sales / sales_dev / sales_demo).
 * env.ts validates AIM_CATALOG is present, but we re-check here as a
 * belt-and-suspenders guard against env-loading order bugs.
 */
export function resolveCatalog(): string {
  const catalog = env.AIM_CATALOG;
  if (!catalog) {
    throw new Error(
      'AIM_CATALOG is not set. Expected sales | sales_dev | sales_demo.',
    );
  }
  return catalog;
}

/**
 * Schema-qualified object name. The single source of truth for building
 * `<catalog>.<schema>.<table>` identifiers. Never hand-format these.
 */
export function qualifiedName(
  schema: 'core' | 'app' | 'pricing' | 'gold' | 'notepad' | 'integration' | 'audit',
  table: string,
): string {
  return `${resolveCatalog()}.${schema}.${table}`;
}

// ─── Connection management ────────────────────────────────────────────

let clientPromise: Promise<IDBSQLClient> | null = null;

function getConnectOptions() {
  const host = env.DATABRICKS_SERVER_HOSTNAME;
  const path = env.DATABRICKS_HTTP_PATH;
  if (!host || !path) {
    throw new Error(
      'DATABRICKS_SERVER_HOSTNAME and DATABRICKS_HTTP_PATH are required.',
    );
  }

  // Prefer PAT (dev-friendly). Fall back to SP creds auto-injected in prod.
  if (env.DATABRICKS_TOKEN) {
    return { host, path, token: env.DATABRICKS_TOKEN };
  }
  if (env.DATABRICKS_CLIENT_ID && env.DATABRICKS_CLIENT_SECRET) {
    // @databricks/sql accepts OAuth M2M via authType + client id/secret.
    // Field names differ across SDK minor versions; kept narrow here so a
    // future SDK bump surfaces a compile error rather than silent failure.
    return {
      host,
      path,
      authType: 'databricks-oauth' as const,
      oauthClientId: env.DATABRICKS_CLIENT_ID,
      oauthClientSecret: env.DATABRICKS_CLIENT_SECRET,
    };
  }
  throw new Error(
    'No Databricks credentials: set DATABRICKS_TOKEN or both DATABRICKS_CLIENT_ID and DATABRICKS_CLIENT_SECRET.',
  );
}

function getClient(): Promise<IDBSQLClient> {
  if (!clientPromise) {
    const client = new DBSQLClient();
    const p: Promise<IDBSQLClient> = client
      .connect(getConnectOptions() as Parameters<DBSQLClient['connect']>[0])
      .catch((err: unknown) => {
        clientPromise = null; // allow retry on next call
        throw err;
      });
    clientPromise = p;
    return p;
  }
  return clientPromise;
}

// ─── SQL hash for log dedup (NOT security) ────────────────────────────

function sqlHash(sql: string): string {
  // FNV-1a 32-bit. Good enough to group identical queries in logs.
  let h = 0x811c9dc5;
  for (let i = 0; i < sql.length; i++) {
    h ^= sql.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

// ─── Parameter binding ────────────────────────────────────────────────

/**
 * Rewrite `?` placeholders to `:param_1, :param_2, ...` in order.
 *
 * SQL string-literal handling: Databricks SQL uses standard ANSI quoting —
 * a single quote inside a literal is escaped by doubling it ('it''s here').
 * Backslash-escape (`\'`) is MySQL-specific and NOT supported by Databricks,
 * so we don't pretend to handle it. Inside a string literal, `?` is a
 * literal character and must NOT be treated as a placeholder.
 *
 * Not a full SQL parser. Handles the common case (single-quoted strings with
 * ANSI escaping). Exotic cases — `?` inside identifiers, dollar-quoting,
 * comments containing `?` — are on the caller to avoid.
 */
function bindParams(
  sql: string,
  params: unknown[],
): { sql: string; named: Record<string, unknown> } {
  let out = '';
  let inString = false;
  let idx = 0;

  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];

    if (c === "'") {
      if (!inString) {
        // Opening quote of a string literal.
        inString = true;
        out += c;
        continue;
      }
      // Currently inside a string literal.
      if (sql[i + 1] === "'") {
        // Doubled quote: the literal contains a single quote. Emit both
        // characters and skip the next iteration's index.
        out += "''";
        i += 1;
        continue;
      }
      // Closing quote of the string literal.
      inString = false;
      out += c;
      continue;
    }

    if (c === '?' && !inString) {
      idx += 1;
      out += `:param_${idx}`;
      continue;
    }

    out += c;
  }

  if (inString) {
    throw new Error(
      'SQL has an unterminated string literal. Check your quoting.',
    );
  }
  if (idx !== params.length) {
    throw new Error(
      `SQL parameter count mismatch: expected ${idx} placeholders, got ${params.length} values.`,
    );
  }

  const named: Record<string, unknown> = {};
  params.forEach((v, i) => {
    named[`param_${i + 1}`] = v;
  });
  return { sql: out, named };
}

// ─── executeQuery ─────────────────────────────────────────────────────

type ExecuteOptions = {
  namedParameters?: Record<string, unknown>;
};

/**
 * Run a parameterized SQL statement. Returns an array of row objects.
 *
 * CLAUDE.md Rule #12: pass values via `params`. Never interpolate user input
 * into `sql` — see § "Parameterization" at the top of this file.
 */
export async function executeQuery<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const client = await getClient();
  const session = await client.openSession();

  const started = Date.now();
  const hash = sqlHash(sql);

  let boundSql = sql;
  const options: ExecuteOptions = {};
  if (params && params.length > 0) {
    const bound = bindParams(sql, params);
    boundSql = bound.sql;
    options.namedParameters = bound.named;
  }

  try {
    const op = await session.executeStatement(
      boundSql,
      options as Parameters<typeof session.executeStatement>[1],
    );
    const rows = (await op.fetchAll()) as T[];
    await op.close();

    const duration_ms = Date.now() - started;
    log.info('db.query', {
      duration_ms,
      row_count: Array.isArray(rows) ? rows.length : 0,
      sql_hash: hash,
    });
    if (duration_ms > 2000) {
      log.warn('db.slow_query', { duration_ms, sql_hash: hash });
      // Sentry breadcrumb — no-op when DSN is unset.
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.addBreadcrumb({
          category: 'db',
          message: 'slow_query',
          level: 'warning',
          data: { duration_ms, sql_hash: hash },
        });
      } catch {
        /* Sentry optional */
      }
    }
    return rows;
  } catch (err) {
    const duration_ms = Date.now() - started;
    log.error('db.query_failed', {
      duration_ms,
      sql_hash: hash,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  } finally {
    await session.close();
  }
}