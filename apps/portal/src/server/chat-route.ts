import { z } from 'zod';
import { systemClock } from '@/lib/clock';
import { getViewer } from '@/server/auth/viewer';
import type { Viewer } from '@/server/auth/types';
import { describeError, isPortalError, RateLimitError } from '@/server/errors';
import { log } from '@/server/log';
import { rateLimit } from '@/server/rate-limit';

const HEADERS = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' } as const;

export const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status, headers: HEADERS });

/**
 * Wraps a polling route: signed in viewer or 401, a per person rate limit (a tab polling every 3 seconds is 20 a minute, so the
 * limit leaves room for a few tabs), and portal errors as { error } with their status. Nothing internal reaches the browser.
 */
export async function chatRoute(
  name: string,
  handler: (viewer: Viewer, clock: typeof systemClock) => Promise<unknown>,
): Promise<Response> {
  const viewer = await getViewer();
  if (!viewer) return json({ error: 'Sign in to continue.' }, 401);
  try {
    rateLimit(`chat:poll:${viewer.id}`, { limit: 240, windowSeconds: 60 });
    return json(await handler(viewer, systemClock));
  } catch (error) {
    if (error instanceof RateLimitError) return new Response(JSON.stringify({ error: 'Too many requests.' }), { status: 429, headers: { ...HEADERS, 'Retry-After': String(error.retryAfterSeconds) } });
    if (!isPortalError(error)) log.error({ route: name, err: error }, 'chat route failed');
    const described = describeError(error);
    return json({ error: described.message }, isPortalError(error) ? error.httpStatus : 500);
  }
}

export const chatId = z.string().uuid();
export const nonNegative = z.coerce.number().int().min(0);
