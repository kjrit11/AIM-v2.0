import { requireDatabricksUser } from '@/lib/databricksUser';

export default function DashboardPage() {
  const user = requireDatabricksUser();

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
