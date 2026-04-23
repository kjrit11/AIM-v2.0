import { randomUUID } from 'crypto';
import { cache } from 'react';
import { executeQuery, qualifiedName, TABLES } from './db';
import { log } from './logger';

// The `(string & {})` tail is a forward-compat idiom: IntelliSense still
// suggests the enumerated values while any other existing warehouse string
// (role vocabulary drift, future values) is accepted without a type error.
// See docs/GOTCHAS.md § "Role vocabulary is prose-case — do not normalize".
export type UserRole =
  | 'Sales Executive'
  | 'Executive'
  | 'Admin'
  | 'pending'
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

export type UserRecord = {
  user_id: string;
  email: string;
  name: string;
  role: UserRole;
  state: string;
  created_at: Date;
  updated_at: Date;
};

/**
 * Look up or provision a user in sales.core.users by email.
 *
 * Uses a two-phase SELECT-then-INSERT pattern. Under concurrent first-logins
 * for the same email, two processes could both SELECT zero rows and both
 * INSERT. Unity Catalog does not enforce uniqueness on email, so duplicates
 * are possible. Acceptable risk for an internal tool with single-digit
 * concurrent new-user signups. Phase 3c or later can add a unique constraint
 * or advisory lock if this becomes real.
 *
 * Existing seed rows are NEVER modified; only INSERTs on SELECT miss.
 *
 * Wrapped with React's `cache()` so multiple callers within the same
 * request (layout + dashboard page) produce a single DB hit. Client-side
 * re-fetches across requests are governed by CACHE.USERS (1h TTL) in
 * queryConfig.ts once a useQuery consumer exists.
 */
export const getOrProvisionUser = cache(async function getOrProvisionUser(
  email: string,
  name: string | null,
): Promise<UserRecord> {
  const usersTable = qualifiedName('core', TABLES.USERS);

  const existing = await executeQuery<UserRecord>(
    `SELECT user_id, email, name, role, state, created_at, updated_at
     FROM ${usersTable}
     WHERE email = ?
     LIMIT 1`,
    [email],
  );

  if (existing.length > 0) {
    log.debug('user.reconcile.hit', { email });
    return existing[0];
  }

  const user_id = randomUUID();
  const safeName = name ?? email;

  await executeQuery(
    `INSERT INTO ${usersTable}
       (user_id, email, name, password_hash, role, state, created_at, updated_at)
     VALUES (?, ?, ?, 'databricks_sso', 'pending', 'Active', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())`,
    [user_id, email, safeName],
  );

  log.info('user.reconcile.provisioned', { email, user_id });

  const inserted = await executeQuery<UserRecord>(
    `SELECT user_id, email, name, role, state, created_at, updated_at
     FROM ${usersTable}
     WHERE user_id = ?
     LIMIT 1`,
    [user_id],
  );

  if (inserted.length === 0) {
    throw new Error(
      `Provisioning failed: inserted user ${user_id} not found on re-SELECT`,
    );
  }

  return inserted[0];
});
