import { randomUUID } from 'node:crypto';

export type HeadersLike = { get(name: string): string | null };

/**
 * Reads x-request-id from the incoming request headers; falls back to a
 * freshly generated UUID. Downstream callers attach this to log lines and
 * Sentry breadcrumbs so a single publish or lead submission can be traced
 * end-to-end across hooks, handlers, and webhook dispatches.
 */
export const getRequestId = (headers: HeadersLike): string => {
  const fromHeader = headers.get('x-request-id')?.trim();
  if (fromHeader && fromHeader.length > 0 && fromHeader.length <= 128) return fromHeader;
  return randomUUID();
};

export type PayloadLoggerLike = {
  info?: (...args: unknown[]) => void;
  warn?: (meta: Record<string, unknown>, msg: string) => void;
  error?: (meta: Record<string, unknown>, msg: string) => void;
} | null | undefined;

/**
 * Returns a thin wrapper around the Payload Pino logger that injects
 * `requestId` into every structured log call automatically.
 */
export const withRequestId = (
  logger: PayloadLoggerLike,
  requestId: string,
): NonNullable<PayloadLoggerLike> => ({
  warn: (meta, msg) => logger?.warn?.({ ...meta, requestId }, msg),
  error: (meta, msg) => logger?.error?.({ ...meta, requestId }, msg),
});
