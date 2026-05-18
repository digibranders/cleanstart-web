import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Short-lived HMAC-signed token authorising a single resource download.
 *
 * Wire format: base64url("<resourceId>.<expiresAt>.<sig>")
 *   resourceId — the Payload Resources row id (numeric or uuid).
 *   expiresAt  — unix ms when the token expires.
 *   sig        — HMAC-SHA256("<resourceId>.<expiresAt>", PAYLOAD_SECRET), base64url.
 *
 * Verification is constant-time. Tampered or expired tokens are rejected.
 */

const DEFAULT_TTL_MS = 60 * 60 * 1000;

const toBase64Url = (input: Buffer | string): string =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=+$/u, '')
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_');

const fromBase64Url = (input: string): Buffer => {
  const padded = input.replace(/-/gu, '+').replace(/_/gu, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64');
};

const sign = (payload: string, secret: string): string => {
  const mac = createHmac('sha256', secret).update(payload).digest();
  return toBase64Url(mac);
};

const constantTimeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};

export interface SignedDownloadToken {
  token: string;
  expiresAt: number;
}

export const signDownloadToken = (params: {
  resourceId: string | number;
  secret: string;
  now?: number;
  ttlMs?: number;
}): SignedDownloadToken => {
  const now = params.now ?? Date.now();
  const ttl = params.ttlMs ?? DEFAULT_TTL_MS;
  const expiresAt = now + ttl;
  const payload = `${String(params.resourceId)}.${expiresAt}`;
  const sig = sign(payload, params.secret);
  const token = toBase64Url(`${payload}.${sig}`);
  return { token, expiresAt };
};

export type VerifyDownloadTokenResult =
  | { ok: true; resourceId: string; expiresAt: number }
  | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' };

export const verifyDownloadToken = (params: {
  token: string;
  secret: string;
  now?: number;
}): VerifyDownloadTokenResult => {
  const now = params.now ?? Date.now();
  let decoded: string;
  try {
    decoded = fromBase64Url(params.token).toString('utf8');
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  const parts = decoded.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };
  const [resourceId, expiresAtRaw, sig] = parts;
  if (!resourceId || !expiresAtRaw || !sig) return { ok: false, reason: 'malformed' };
  const expiresAt = Number.parseInt(expiresAtRaw, 10);
  if (!Number.isFinite(expiresAt)) return { ok: false, reason: 'malformed' };

  const expectedSig = sign(`${resourceId}.${expiresAt}`, params.secret);
  if (!constantTimeEqual(sig, expectedSig)) return { ok: false, reason: 'bad_signature' };

  if (expiresAt <= now) return { ok: false, reason: 'expired' };

  return { ok: true, resourceId, expiresAt };
};
