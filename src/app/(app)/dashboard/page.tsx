import { requireAuth } from '@/auth';

/**
 * Dashboard — AIM v2 Phase 2 placeholder
 * ========================================
 *
 * First authenticated route. Middleware already enforces auth at the
 * edge; requireAuth() here gives the server component a typed,
 * non-null user and doubles as a defense-in-depth guard (page won't
 * render without a session, even if the matcher regex ever regresses).
 *
 * Phase 7 replaces this placeholder with the real Overview module
 * (KPI tiles, pipeline chart, recent activity). See docs/REBUILD_PLAN.md.
 */

export default async function DashboardPage() {
  const user = await requireAuth('/dashboard');

  return (
    <div className="mx-auto max-w-page px-6 py-8">
      <h1 className="mb-2 text-page-title font-medium text-text-primary">
        Dashboard
      </h1>
      <p className="mb-8 text-body text-text-body">
        Signed in as{' '}
        <span className="font-mono text-mono text-text-primary">
          {user.email}
        </span>
        . Real Overview lands in Phase 7.
      </p>
    </div>
  );
}
