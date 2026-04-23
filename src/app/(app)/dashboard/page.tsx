import { requireDatabricksUser } from '@/lib/databricksUser';
import { getOrProvisionUser } from '@/lib/users';

export default async function DashboardPage() {
  const user = requireDatabricksUser();
  // Deduped within a request: the (app) layout already called this; React's
  // cache() returns the memoized result here with no second DB round-trip.
  const userRecord = await getOrProvisionUser(user.email, user.username);

  return (
    <div className="mx-auto max-w-page px-6 py-8">
      <h1 className="mb-2 text-page-title font-medium text-text-primary">
        Dashboard
      </h1>
      <p className="mb-2 text-body text-text-body">
        Signed in as{' '}
        <span className="font-mono text-mono text-text-primary">
          {user.email}
        </span>
        . Real Overview lands in Phase 7.
      </p>
      <p className="mb-8 text-body text-text-body">
        Role:{' '}
        <span className="font-mono text-mono text-text-primary">
          {userRecord.role}
        </span>
      </p>
    </div>
  );
}
