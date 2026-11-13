import { z } from 'zod';
import { env } from '@/env';
import { IntegrationError, ValidationError } from '@/server/errors';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 8000;

const siteverifySchema = z.object({ success: z.boolean() });

/**
 * Cloudflare Turnstile server side check. Throws ValidationError (path "turnstile") when the visitor failed or sent no
 * token, IntegrationError('turnstile') when Cloudflare cannot be reached. Dev and test use Cloudflare's always-pass keys
 * (env.ts), so no real challenge is needed locally.
 */
export async function verifyTurnstile(input: { token: string | null; ip: string | null }): Promise<void> {
  const token = input.token?.trim();
  if (!token) throw new ValidationError([{ path: 'turnstile', message: 'Confirm you are not a robot.' }]);

  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (input.ip) form.set('remoteip', input.ip);

  let success: boolean;
  try {
    const response = await fetch(VERIFY_URL, { method: 'POST', body: form, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) throw new IntegrationError('turnstile', `siteverify answered ${response.status}`, { status: response.status });
    success = siteverifySchema.parse(await response.json()).success;
  } catch (error) {
    if (error instanceof IntegrationError) throw error;
    throw new IntegrationError('turnstile', 'siteverify request failed', { cause: error });
  }
  if (!success) throw new ValidationError([{ path: 'turnstile', message: 'The robot check failed. Try again.' }]);
}
