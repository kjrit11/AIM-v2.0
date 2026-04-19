'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Sign-in page — AIM v2
 * =======================
 *
 * Custom sign-in page (configured via `pages.signIn` in src/auth.ts).
 * Single "Sign in with Microsoft" CTA that kicks off the Azure OAuth flow.
 *
 * Reads callbackUrl from the query string (set by middleware when redirecting
 * an unauthenticated request). Defaults to /dashboard.
 *
 * Client component because signIn() must run in the browser to perform the
 * redirect. Wrapped in Suspense because useSearchParams() requires it in
 * App Router during static generation — Next.js errors out on build if the
 * hook is used outside a Suspense boundary on a page that might be static.
 */

function SignInCard() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  return (
    <Card className="w-full max-w-sign-in p-8">
      <h1 className="mb-2 text-page-title font-medium text-text-primary">
        Sign in
      </h1>
      <p className="mb-8 text-body text-text-body">
        Access the AIM Sales Command Center with your Microsoft account.
      </p>
      <Button
        variant="primary"
        size="md"
        className="w-full"
        onClick={() => void signIn('azure-ad', { callbackUrl })}
      >
        Sign in with Microsoft
      </Button>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-page px-6 py-10">
      <Suspense fallback={null}>
        <SignInCard />
      </Suspense>
    </main>
  );
}
