import { handlers } from '@/auth';

/**
 * NextAuth route handler — AIM v2
 * =================================
 *
 * v5's `handlers` object exposes GET/POST as-is; we destructure them
 * from src/auth.ts so the handler surface is one line and all NextAuth
 * config lives at src/auth.ts. Do NOT add route logic here — if you
 * need a custom endpoint, add it under /api/ (not under /api/auth/).
 */

export const { GET, POST } = handlers;
