import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * `cs_gate_unlock` cookie — remembers which gated resource IDs the
 * current browser has already unlocked, so repeat visitors don't see
 * the form modal again.
 *
 * Format: base64url(JSON({ ids: string[], issued: number })) + "." + sigBase64url
 * Signed with PAYLOAD_SECRET to make tampering detectable. httpOnly.
 */

export const UNLOCK_COOKIE_NAME = 'cs_gate_unlock';
const MAX_IDS = 50;
const DEFAULT_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

interface UnlockPayload {
  ids: string[];
  issued: number;
}

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

const sign = (body: string, secret: string): string => {
  const mac = createHmac('sha256', secret).update(body).digest();
  return toBase64Url(mac);
};

const constantTimeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};

const encode = (payload: UnlockPayload, secret: string): string => {
  const body = toBase64Url(JSON.stringify(payload));
  const sig = sign(body, secret);
  return `${body}.${sig}`;
};

const decode = (value: string, secret: string): UnlockPayload | null => {
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = sign(body, secret);
  if (!constantTimeEqual(sig, expected)) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(body).toString('utf8')) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      Array.isArray((parsed as UnlockPayload).ids) &&
      (parsed as UnlockPayload).ids.every((id) => typeof id === 'string') &&
      typeof (parsed as UnlockPayload).issued === 'number'
    ) {
      return parsed as UnlockPayload;
    }
    return null;
  } catch {
    return null;
  }
};

const parseCookieHeader = (header: string | null | undefined): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const pair of header.split(';')) {
    const eq = pair.indexOf('=');
    if (eq <= 0) continue;
    const key = pair.slice(0, eq).trim();
    const val = pair.slice(eq + 1).trim();
    if (key && !(key in out)) out[key] = decodeURIComponent(val);
  }
  return out;
};

/** Returns the list of resource IDs the visitor has already unlocked. Empty on missing/tampered. */
export const readUnlockedIds = (
  cookieHeader: string | null | undefined,
  secret: string,
): string[] => {
  const cookies = parseCookieHeader(cookieHeader);
  const raw = cookies[UNLOCK_COOKIE_NAME];
  if (!raw) return [];
  const payload = decode(raw, secret);
  return payload?.ids ?? [];
};

export interface BuildUnlockCookieOptions {
  resourceId: string | number;
  cookieHeader: string | null | undefined;
  secret: string;
  now?: number;
  maxAgeSeconds?: number;
  secure?: boolean;
}

/**
 * Returns the value of a `Set-Cookie` header that appends the given
 * resourceId to the visitor's unlock list. Caps at MAX_IDS (rolling — newest kept).
 */
export const buildUnlockCookieHeader = (opts: BuildUnlockCookieOptions): string => {
  const existing = readUnlockedIds(opts.cookieHeader, opts.secret);
  const id = String(opts.resourceId);
  // Move-to-end semantics: remove if present, then append. Keeps newest at the tail.
  const filtered = existing.filter((entry) => entry !== id);
  filtered.push(id);
  const ids = filtered.length > MAX_IDS ? filtered.slice(filtered.length - MAX_IDS) : filtered;

  const value = encode({ ids, issued: opts.now ?? Date.now() }, opts.secret);
  const maxAge = opts.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS;
  const attrs = [
    `${UNLOCK_COOKIE_NAME}=${value}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (opts.secure !== false) attrs.push('Secure');
  return attrs.join('; ');
};

export const __maxIds = MAX_IDS;
