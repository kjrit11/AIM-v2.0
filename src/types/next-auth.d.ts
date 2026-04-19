import type { DefaultSession } from 'next-auth';

/**
 * NextAuth type augmentation — AIM v2
 * =====================================
 *
 * Extends the library's Session and JWT types with the Entra ID claims
 * we care about: sub (subject), email, name, given_name, family_name.
 *
 * Phase 2 is pre-DB: there's no role, no user_id from sales.core.users.
 * Those land in Phase 3 when we join Entra claims against the DB users
 * table and derive a role from group membership. When that happens,
 * extend this file with `role`, `userId`, `entraGroups`.
 *
 * Why we augment `@auth/core/jwt` (not `next-auth/jwt`): the
 * `next-auth/jwt` module is a pure re-export of `@auth/core/jwt`, so
 * module augmentation must target the source module. Augmenting the
 * re-export is a no-op and leaves token fields typed as `unknown`.
 *
 * Why `sub` is non-optional: Entra always issues it. If it's ever missing,
 * something is broken upstream and we want a loud failure, not a null guard.
 */

declare module 'next-auth' {
  interface Session {
    user: {
      sub: string;
      email: string;
      name: string;
      given_name: string | null;
      family_name: string | null;
    } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    sub: string;
    email: string;
    name: string;
    given_name: string | null;
    family_name: string | null;
  }
}
