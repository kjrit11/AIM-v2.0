import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export type DatabricksUser = {
  userId: string;       // stable IdP user ID, from before '@' in x-forwarded-user
  workspaceId: string;  // from after '@' in x-forwarded-user
  email: string;
  username: string;
  // accessToken kept separate; never include in logs or client-visible payloads
  accessToken: string | null;
};

export function getDatabricksUser(): DatabricksUser | null {
  const h = headers();
  const email = h.get('x-forwarded-email');
  const rawUser = h.get('x-forwarded-user');

  if (!email || !rawUser) {
    if (process.env.NODE_ENV === 'development') {
      // Dynamic import so devAuth is tree-shaken from prod bundles
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getDevUser } = require('./devAuth');
      return getDevUser();
    }
    return null;
  }

  const [userId, workspaceId = ''] = rawUser.split('@');
  return {
    userId,
    workspaceId,
    email,
    username: h.get('x-forwarded-preferred-username') ?? email,
    accessToken: h.get('x-forwarded-access-token'),
  };
}

export function requireDatabricksUser(): DatabricksUser {
  const user = getDatabricksUser();
  if (!user) redirect('/');
  return user;
}
