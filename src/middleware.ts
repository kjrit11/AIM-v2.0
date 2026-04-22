import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Defense-in-depth: Databricks proxy enforces auth at the platform edge,
  // but reject requests missing x-forwarded-email in prod as a safety net.
  if (process.env.NODE_ENV === 'production') {
    const email = req.headers.get('x-forwarded-email');
    if (!email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  // Attach a request ID for observability (CLAUDE.md Rule #7).
  // We do NOT use AsyncLocalStorage here — middleware runs on the Edge
  // runtime. Instead, we stamp the request ID on both the incoming request
  // headers (so Node-runtime handlers can read it via next/headers and
  // bind it into requestContext via withRequestContext) and the response
  // headers (for client-side correlation). See docs/GOTCHAS.md §
  // "AsyncLocalStorage is Node-runtime-only".
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-request-id', requestId);

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  res.headers.set('x-request-id', requestId);
  return res;
}

export const config = {
  matcher: [
    // Match all request paths except for static assets and Next internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
