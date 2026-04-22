/**
 * Request-scoped context — AIM v2 (Phase 3a)
 * ==========================================
 *
 * AsyncLocalStorage binding for per-request values (request ID, user email).
 * Read by logger.ts and executeQuery() in db.ts.
 *
 * Why not middleware-level: middleware runs on the Edge runtime, which does
 * not have reliable async_hooks support. Route handlers and server components
 * run on the Node runtime — they call withRequestContext() to bind the
 * request ID read from the incoming x-request-id header (set by middleware).
 *
 * See docs/GOTCHAS.md § "AsyncLocalStorage is Node-runtime-only".
 *
 * Server-only. Do not import from client components.
 */

import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
  requestId: string;
  userEmail?: string;
};

const als = new AsyncLocalStorage<RequestContext>();

export function getContext(): RequestContext | undefined {
  return als.getStore();
}

export function withRequestContext<T>(
  ctx: RequestContext,
  fn: () => Promise<T>,
): Promise<T> {
  return als.run(ctx, fn);
}
