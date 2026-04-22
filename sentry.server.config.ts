/**
 * Sentry — server runtime config (Phase 3a)
 * =========================================
 *
 * TODO: Sentry project not yet provisioned for AIM v2. DSN stub until
 * created. See PROGRESS.md.
 *
 * This file is dynamically imported by src/instrumentation.ts only when
 * SENTRY_DSN is present. When the env var is unset, Sentry is fully
 * no-op — logger.ts still emits structured JSON to stdout, which is the
 * primary observability surface in Phase 3a.
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
