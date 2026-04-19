export { auth as middleware } from '@/auth';

/**
 * Route-protection middleware — AIM v2
 * ======================================
 *
 * Phase 2 responsibility: block unauthenticated requests to protected
 * routes, redirect to /auth/signin with callbackUrl preserved.
 *
 * Allowlist (do NOT run auth):
 *   /                            — unauthenticated landing
 *   /auth/*                      — sign-in + error pages
 *   /design                      — dev-only design gallery
 *   /_next/static/*              — static assets
 *   /_next/image                 — image optimizer
 *   /api/auth/*                  — NextAuth endpoints (covered by /api exclusion)
 *   /favicon.ico
 *
 * The matcher regex below uses a negative lookahead that exempts these
 * paths. See the walk-through in the Phase 2 self-check for each of
 * the 8 canonical test paths.
 *
 * GOTCHA: prefix-match on `design` means /designer, /design-tokens etc.
 * will ALSO be treated as public. If such routes are added, tighten this
 * matcher OR rename the route. See docs/GOTCHAS.md.
 *
 * This middleware handles AUTH ONLY. Request-ID middleware is a Phase 3
 * concern (structured logging lives there) — do not combine.
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|design|auth|$).*)',
  ],
};
