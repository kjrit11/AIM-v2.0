'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Auth error page — AIM v2
 * ==========================
 *
 * Configured via `pages.error` in src/auth.ts. NextAuth redirects here
 * with ?error=<code> when OAuth fails — e.g. user cancels, token
 * exchange fails, configuration is wrong.
 *
 * We surface the raw error code so Kevin can tell Microsoft Entra
 * support "we got error Foo" when triaging. The /auth/signin button
 * lets the user try again without hand-editing the URL.
 *
 * Wrapped in Suspense because useSearchParams() requires it in App
 * Router during static generation.
 */

const ERROR_COPY: Record<string, { title: string; body: string }> = {
  Configuration: {
    title: 'Configuration error',
    body: 'The auth provider is misconfigured. Contact the AIM admin.',
  },
  AccessDenied: {
    title: 'Access denied',
    body: 'You were signed in but aren\u2019t permitted to use AIM. Contact the AIM admin.',
  },
  Verification: {
    title: 'Verification failed',
    body: 'The sign-in link is no longer valid. Request a new one.',
  },
  Default: {
    title: 'Sign-in failed',
    body: 'Something went wrong during sign-in. Try again, or contact the AIM admin if the problem persists.',
  },
};

function ErrorCard() {
  const searchParams = useSearchParams();
  const code = searchParams.get('error') ?? 'Default';
  const copy = ERROR_COPY[code] ?? ERROR_COPY.Default;

  return (
    <Card className="w-full max-w-sign-in p-8">
      <h1 className="mb-2 text-page-title font-medium text-text-primary">
        {copy.title}
      </h1>
      <p className="mb-2 text-body text-text-body">{copy.body}</p>
      <p className="mb-8 font-mono text-caption text-text-muted">
        code: {code}
      </p>
      <Link href="/auth/signin" className="block">
        <Button variant="primary" size="md" className="w-full">
          Try again
        </Button>
      </Link>
    </Card>
  );
}

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-page px-6 py-10">
      <Suspense fallback={null}>
        <ErrorCard />
      </Suspense>
    </main>
  );
}
