/**
 * Sentry — client runtime config (Phase 3a)
 * =========================================
 *
 * TODO: Sentry project not yet provisioned for AIM v2. DSN stub until
 * created. See PROGRESS.md.
 *
 * Next.js loads this file automatically on the client when present.
 * When SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN are unset the init call is
 * skipped and Sentry remains inert.
 */

import * as Sentry from '@sentry/nextjs';

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  });
}
