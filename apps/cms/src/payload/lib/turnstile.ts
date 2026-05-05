/**
 * Cloudflare Turnstile verification — server-side guard that the user
 * actually solved the challenge before we accept a submission.
 *
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 *
 * Behaviour:
 * - When TURNSTILE_SECRET_KEY is unset (local dev), `verifyTurnstileToken`
 *   returns `{ ok: true, mode: 'disabled' }` so dev iteration isn't blocked.
 * - When the secret is present, the token is required and validated
 *   against Cloudflare's siteverify endpoint.
 */
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type TurnstileResult =
  | { ok: true; mode: 'disabled' | 'verified'; hostname?: string | undefined }
  | { ok: false; reason: 'missing-token' | 'invalid' | 'network'; codes?: string[] | undefined };

type SiteverifyResponse = {
  success: boolean;
  hostname?: string;
  'error-codes'?: string[];
};

export const verifyTurnstileToken = async (
  token: string | null | undefined,
  remoteIp?: string,
): Promise<TurnstileResult> => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { ok: true, mode: 'disabled' };
  }

  if (!token || token.trim().length === 0) {
    return { ok: false, reason: 'missing-token' };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  let response: Response;
  try {
    response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (!response.ok) {
    return { ok: false, reason: 'network' };
  }

  const data = (await response.json().catch(() => null)) as SiteverifyResponse | null;
  if (!data) return { ok: false, reason: 'network' };

  if (data.success) {
    return { ok: true, mode: 'verified', hostname: data.hostname };
  }
  return { ok: false, reason: 'invalid', codes: data['error-codes'] };
};
