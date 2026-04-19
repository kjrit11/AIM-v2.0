import Link from 'next/link';
import { Button } from '@/components/ui/Button';

/**
 * Unauthenticated landing page — AIM v2
 * =======================================
 *
 * Public, no middleware gate. Two clear calls to action:
 *   - Primary: sign in
 *   - Secondary: view the design gallery (dev aid, stays public)
 *
 * An already-signed-in user who lands here can still use the sidebar
 * once they're inside the app — we don't redirect them to /dashboard
 * from here, because the landing is also the sign-out destination and
 * redirecting would create a sign-out loop on a still-cached session.
 */

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-page px-6 py-10">
      <div className="w-full max-w-sign-in">
        <h1 className="mb-2 text-page-title font-medium text-text-primary">
          AIM
        </h1>
        <p className="mb-8 text-body text-text-body">
          Sales Command Center for CareIntelligence.
        </p>

        <Link href="/auth/signin" className="block">
          <Button variant="primary" size="md" className="w-full">
            Sign in
          </Button>
        </Link>

        <div className="mt-6 border-t border-border-subtle pt-6">
          <Link
            href="/design"
            className="text-caption text-text-muted underline underline-offset-4 transition-colors duration-150 hover:text-text-body"
          >
            Component gallery (/design)
          </Link>
        </div>
      </div>
    </main>
  );
}
