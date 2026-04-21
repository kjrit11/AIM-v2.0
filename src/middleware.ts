import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Attach a request ID for observability (CLAUDE.md Rule #7)
  const requestId = crypto.randomUUID();
  const res = NextResponse.next();
  res.headers.set('x-request-id', requestId);

  // Defense-in-depth: Databricks proxy enforces auth at the platform edge,
  // but reject requests missing x-forwarded-email in prod as a safety net.
  if (process.env.NODE_ENV === 'production') {
    const email = req.headers.get('x-forwarded-email');
    if (!email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  return res;
}

export const config = {
  matcher: [
    // Match all request paths except for static assets and Next internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
