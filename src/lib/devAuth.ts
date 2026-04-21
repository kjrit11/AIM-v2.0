// Dev-only shim. Dynamically imported from databricksUser.ts when NODE_ENV === 'development'.
// Do not import this file directly from anywhere else.
import type { DatabricksUser } from './databricksUser';

export function getDevUser(): DatabricksUser {
  return {
    userId: 'dev-user-local',
    workspaceId: 'dev-workspace',
    email: 'dev@local.test',
    username: 'dev@local.test',
    accessToken: null,
  };
}
