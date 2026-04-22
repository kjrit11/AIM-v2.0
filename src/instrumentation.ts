/**
 * Next.js 14 instrumentation hook — AIM v2 (Phase 3a)
 * ===================================================
 *
 * Initializes Sentry for the runtime Next.js is booting. No-op when
 * SENTRY_DSN is empty so local dev and the first dev-catalog deploy work
 * without a provisioned Sentry project.
 *
 * TODO: Sentry project not yet provisioned for AIM v2. DSN stub until
 * created. See PROGRESS.md.
 */

export async function register() {
  if (!process.env.SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}
