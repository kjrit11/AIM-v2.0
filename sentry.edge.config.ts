/**
 * Sentry — Edge runtime config (Phase 3a)
 * =======================================
 *
 * TODO: Sentry project not yet provisioned for AIM v2. DSN stub until
 * created. See PROGRESS.md.
 *
 * Edge runtime does not share the Node instance with server.config, so
 * Sentry needs its own init here for middleware and Edge routes.
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  });
}
