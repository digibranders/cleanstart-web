import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Minimal HS256 JWT for preview-share links. Built on `node:crypto`
 * rather than pulling in `jose` because (a) we only need one alg,
 * (b) the surface stays auditable, and (c) it mirrors the in-repo
 * `lib/integrations/secrets.ts` "lean crypto helper" pattern.
 *
 * Tokens carry the minimum needed for the verify endpoint to look
 * up the matching audit row and refuse revoked links. Audit-row id
 * is embedded directly so revoke lookups are O(1).
 */

const ALG = 'HS256';
const TYPE = 'JWT';

export interface PreviewTokenPayload {
  /** Payload collection slug, e.g. 'blogs'. */
  collection: string;
  /** Payload doc id (string or number coerced to string). */
  docId: string;
  /** User id of the editor who minted the token. */
  actorId: string;
  /** PreviewAudit row id — primary key for revoke lookups. */
  auditId: string;
  /** Seconds since epoch when the token expires. */
  exp: number;
  /** Seconds since epoch when the token was issued. */
  iat: number;
}

const base64url = (input: Buffer | string): string => {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64urlDecode = (input: string): Buffer => {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64');
};

const getSecret = (): string => {
  const secret = process.env.PREVIEW_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'PREVIEW_JWT_SECRET must be set to a high-entropy value (≥32 chars)',
    );
  }
  return secret;
};

const sign = (input: string, secret: string): string =>
  base64url(createHmac('sha256', secret).update(input).digest());

export const MAX_PREVIEW_TTL_SECONDS = 30 * 24 * 60 * 60;

export const ALLOWED_TTL_PRESETS = [
  60 * 60, //         1h
  24 * 60 * 60, //   24h
  72 * 60 * 60, //   72h
  7 * 24 * 60 * 60, // 7d
  30 * 24 * 60 * 60, // 30d
] as const;

export interface SignArgs {
  collection: string;
  docId: string;
  actorId: string;
  auditId: string;
  ttlSeconds: number;
  /** Override `Date.now()` for tests. */
  now?: Date;
}

export const signPreviewToken = ({
  collection,
  docId,
  actorId,
  auditId,
  ttlSeconds,
  now,
}: SignArgs): { token: string; payload: PreviewTokenPayload } => {
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error('ttlSeconds must be > 0');
  }
  if (ttlSeconds > MAX_PREVIEW_TTL_SECONDS) {
    throw new Error(`ttlSeconds exceeds max (${MAX_PREVIEW_TTL_SECONDS}s)`);
  }
  const issued = Math.floor((now ?? new Date()).getTime() / 1000);
  const payload: PreviewTokenPayload = {
    collection,
    docId,
    actorId,
    auditId,
    iat: issued,
    exp: issued + Math.floor(ttlSeconds),
  };
  const header = base64url(JSON.stringify({ alg: ALG, typ: TYPE }));
  const body = base64url(JSON.stringify(payload));
  const signingInput = `${header}.${body}`;
  const signature = sign(signingInput, getSecret());
  return { token: `${signingInput}.${signature}`, payload };
};

export type VerifyResult =
  | { ok: true; payload: PreviewTokenPayload }
  | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' | 'bad_payload' };

export const verifyPreviewToken = (token: string, now?: Date): VerifyResult => {
  if (typeof token !== 'string' || token.length === 0) {
    return { ok: false, reason: 'malformed' };
  }
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };
  const [headerB64, bodyB64, sigB64] = parts as [string, string, string];
  const signingInput = `${headerB64}.${bodyB64}`;
  const expected = sign(signingInput, getSecret());
  // Constant-time compare. Mismatched length = immediate fail without
  // exposing length info via early-return.
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(sigB64);
  if (expectedBuf.length !== providedBuf.length) {
    return { ok: false, reason: 'bad_signature' };
  }
  if (!timingSafeEqual(expectedBuf, providedBuf)) {
    return { ok: false, reason: 'bad_signature' };
  }
  let payload: PreviewTokenPayload;
  try {
    payload = JSON.parse(base64urlDecode(bodyB64).toString('utf8')) as PreviewTokenPayload;
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (
    typeof payload.collection !== 'string' ||
    typeof payload.docId !== 'string' ||
    typeof payload.actorId !== 'string' ||
    typeof payload.auditId !== 'string' ||
    typeof payload.exp !== 'number' ||
    typeof payload.iat !== 'number'
  ) {
    return { ok: false, reason: 'bad_payload' };
  }
  const nowSec = Math.floor((now ?? new Date()).getTime() / 1000);
  if (payload.exp <= nowSec) return { ok: false, reason: 'expired' };
  return { ok: true, payload };
};
