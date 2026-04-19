import NextAuth from 'next-auth';
import AzureAD from 'next-auth/providers/azure-ad';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';

/**
 * NextAuth v5 config — AIM v2
 * =============================
 *
 * File location is `src/auth.ts` (v5 convention), NOT `src/lib/auth.ts`.
 * See CLAUDE.md § Non-negotiable rules, rule #2.
 *
 * Provider: AzureAD (deprecated re-export of MicrosoftEntraID that pins
 * `id: "azure-ad"` — see docs/GOTCHAS.md § "NextAuth v5 azure-ad provider
 * is deprecated re-export"). We use the deprecated name specifically
 * because the Azure app registration's redirect URI is registered at
 * /api/auth/callback/azure-ad; switching to `microsoft-entra-id` would
 * change the provider id to `microsoft-entra-id` and require a new
 * Azure-side registration. Keep the pinned id until Kevin chooses to
 * re-register.
 *
 * Session strategy: JWT (stateless). No DB user table in Phase 2; we
 * trust the Entra claims directly and stash them on the token.
 * Authorization is allow-any-signed-in-user until Phase 3 introduces
 * role derivation via sales.core.users + Entra group membership.
 *
 * Exports: { auth, handlers, signIn, signOut } — all four of v5's
 * exports, plus two server-side helpers (getSessionUser, requireAuth)
 * consumed by Server Components and Route Handlers.
 */

/**
 * Shape the Entra claims we care about. `profile` in the OIDC callback
 * is typed as the open-ended base Profile; this helper narrows it to
 * the Microsoft-specific fields we need, with string-or-null semantics.
 */
type EntraClaims = {
  sub: string;
  email: string;
  name: string;
  given_name: string | null;
  family_name: string | null;
};

function claimsFromProfile(profile: Record<string, unknown>): EntraClaims {
  const str = (v: unknown): string | null =>
    typeof v === 'string' && v.length > 0 ? v : null;
  return {
    sub: str(profile.sub) ?? '',
    email: str(profile.email) ?? str(profile.preferred_username) ?? '',
    name: str(profile.name) ?? '',
    given_name: str(profile.given_name),
    family_name: str(profile.family_name),
  };
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    AzureAD({
      clientId: env.AZURE_AD_CLIENT_ID,
      clientSecret: env.AZURE_AD_CLIENT_SECRET,
      // Single-tenant issuer URL. `tenantId` isn't exposed on the v5
      // provider's config type; encode it in `issuer` instead.
      issuer: `https://login.microsoftonline.com/${env.AZURE_AD_TENANT_ID}/v2.0`,
      // Override the default profile callback so the User record we
      // persist into the JWT carries the given/family name fields. The
      // default Entra provider profile callback returns only
      // { id, name, email, image } which loses the split-name claims.
      profile(profile) {
        const c = claimsFromProfile(profile as unknown as Record<string, unknown>);
        return {
          id: c.sub,
          name: c.name || null,
          email: c.email || null,
          image: null,
        };
      },
    }),
  ],

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  callbacks: {
    // Runs once at sign-in (with `profile` populated), then re-runs on
    // token refresh with just `token`. We capture Entra claims once and
    // keep them on the token for the session lifetime.
    async jwt({ token, profile }) {
      if (profile) {
        const c = claimsFromProfile(profile as unknown as Record<string, unknown>);
        token.sub = c.sub || token.sub || '';
        token.email = c.email || token.email || '';
        token.name = c.name || token.name || '';
        token.given_name = c.given_name;
        token.family_name = c.family_name;
      }
      return token;
    },

    // Shape the session object consumed by useSession() and auth() in RSCs.
    async session({ session, token }) {
      session.user = {
        ...session.user,
        sub: token.sub ?? '',
        email: token.email ?? '',
        name: token.name ?? '',
        given_name: token.given_name ?? null,
        family_name: token.family_name ?? null,
      };
      return session;
    },
  },

  secret: env.NEXTAUTH_SECRET,
  trustHost: true,
});

/**
 * Read the current user from the server. Returns null when unauthenticated.
 * Use in Server Components and Route Handlers that allow unauthenticated
 * access (e.g. the public landing page conditionally showing a sign-in link).
 */
export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require an authenticated user. Redirects to the sign-in page when
 * unauthenticated, preserving the current URL as callbackUrl. Throws
 * `NEXT_REDIRECT` — do not try/catch this; let Next.js propagate it.
 *
 * Use in Server Components and Route Handlers that must have a user.
 * Protected pages already sit behind middleware, but calling this
 * also gives the caller a typed non-null user.
 */
export async function requireAuth(callbackUrl = '/dashboard') {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return user;
}
