/**
 * Structured JSON logger — AIM v2 (Phase 3a)
 * ==========================================
 *
 * One line of JSON per call, emitted to stdout. Request ID and user email are
 * read from requestContext's AsyncLocalStorage when available so callers do
 * not have to thread them through every function.
 *
 * Shape:
 *   { timestamp, level, message, request_id?, user_email?, ...ctx }
 *
 * debug() is a no-op in production.
 *
 * No third-party deps — CLAUDE.md constrains this to a thin console.log
 * wrapper. If structured log sinks, sampling, or rotation are needed later,
 * add them here rather than pulling in pino/winston.
 *
 * Server-only. Do not import from client components.
 */

import { getContext } from './requestContext';

type Level = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

function emit(level: Level, message: string, ctx?: LogContext): void {
  if (level === 'debug' && process.env.NODE_ENV === 'production') return;

  const rc = getContext();
  const line: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(rc?.requestId ? { request_id: rc.requestId } : {}),
    ...(rc?.userEmail ? { user_email: rc.userEmail } : {}),
    ...(ctx ?? {}),
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(line));
}

export const log = {
  debug: (message: string, ctx?: LogContext) => emit('debug', message, ctx),
  info: (message: string, ctx?: LogContext) => emit('info', message, ctx),
  warn: (message: string, ctx?: LogContext) => emit('warn', message, ctx),
  error: (message: string, ctx?: LogContext) => emit('error', message, ctx),
};
