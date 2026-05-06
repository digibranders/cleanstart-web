import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

/**
 * Standard Webhooks signing — https://standardwebhooks.com.
 *
 * Wire format: three headers per delivery.
 *   webhook-id        — unique per delivery (UUID)
 *   webhook-timestamp — Unix seconds at sign time
 *   webhook-signature — space-separated `vN,<base64-hmac>` tuples;
 *                       multiple keys allowed for rotation
 *
 * Signature input is `<id>.<timestamp>.<body>`. Receivers verify by
 * recomputing HMAC-SHA256 with the shared secret and comparing in
 * constant time.
 */

export interface WebhookSigningKey {
  /** Free-form key id used in audit logs / rotation. */
  readonly id: string;
  /** The shared HMAC secret. */
  readonly secret: string;
}

export interface SignedHeaders {
  readonly 'webhook-id': string;
  readonly 'webhook-timestamp': string;
  readonly 'webhook-signature': string;
}

export interface SignWebhookOptions {
  /** Override the auto-generated UUID — used in tests for determinism. */
  readonly id?: string;
  /** Override `Date.now()` — used in tests for determinism. */
  readonly timestamp?: Date;
}

const computeSignature = (
  payload: string,
  secret: string,
  id: string,
  timestamp: string,
): string => {
  const toSign = `${id}.${timestamp}.${payload}`;
  return createHmac('sha256', secret).update(toSign).digest('base64');
};

/**
 * Sign a webhook payload with one or more keys. Multi-key signing
 * supports zero-downtime secret rotation: the receiver accepts any
 * signature that verifies, so old + new secrets coexist during a
 * deploy.
 */
export const signWebhook = (
  payload: string,
  keys: readonly WebhookSigningKey[],
  options: SignWebhookOptions = {},
): SignedHeaders => {
  if (keys.length === 0) {
    throw new Error('At least one signing key is required');
  }
  const id = options.id ?? randomUUID();
  const timestamp = String(Math.floor((options.timestamp ?? new Date()).getTime() / 1000));
  const signature = keys
    .map((key) => `v1,${computeSignature(payload, key.secret, id, timestamp)}`)
    .join(' ');
  return {
    'webhook-id': id,
    'webhook-timestamp': timestamp,
    'webhook-signature': signature,
  };
};

export interface VerifyWebhookOptions {
  /**
   * How far in the past / future the timestamp is allowed to be,
   * in seconds. Standard Webhooks recommends 5 minutes. Receivers
   * outside this window are rejected to neutralise replay attacks.
   */
  readonly toleranceSeconds?: number;
  /** Override `Date.now()` — used in tests. */
  readonly now?: Date;
}

const DEFAULT_TOLERANCE_SECONDS = 300;

/**
 * Verify a delivery against one or more keys. Returns the matching
 * key id on success, or `null` if no signature verifies. Constant-
 * time signature comparison neutralises timing oracles.
 *
 * Note: `keys` is the receiver-side allow-list. The sender's `id`
 * label is *not* sent over the wire (Standard Webhooks identifies
 * by signature value, not key name) — we just expose the matched
 * `id` so callers can audit which key authenticated the request.
 */
export const verifyWebhook = (
  headers: { readonly [K in keyof SignedHeaders]?: string | null },
  payload: string,
  keys: readonly WebhookSigningKey[],
  options: VerifyWebhookOptions = {},
): { ok: true; matchedKeyId: string } | { ok: false; reason: string } => {
  const id = headers['webhook-id'];
  const timestamp = headers['webhook-timestamp'];
  const signature = headers['webhook-signature'];
  if (!id || !timestamp || !signature) {
    return { ok: false, reason: 'missing-headers' };
  }
  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'invalid-timestamp' };
  const now = Math.floor((options.now ?? new Date()).getTime() / 1000);
  const tolerance = options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (Math.abs(now - ts) > tolerance) return { ok: false, reason: 'timestamp-out-of-tolerance' };

  // Sender may include multiple `vN,<sig>` tuples — accept any that
  // matches any of our keys. We only support v1 today.
  const candidates = signature
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.startsWith('v1,'))
    .map((t) => t.slice(3));
  if (candidates.length === 0) return { ok: false, reason: 'no-v1-signature' };

  for (const key of keys) {
    const expected = computeSignature(payload, key.secret, id, timestamp);
    const expectedBytes = Buffer.from(expected);
    for (const candidate of candidates) {
      const candidateBytes = Buffer.from(candidate);
      if (candidateBytes.length !== expectedBytes.length) continue;
      if (timingSafeEqual(candidateBytes, expectedBytes)) {
        return { ok: true, matchedKeyId: key.id };
      }
    }
  }
  return { ok: false, reason: 'no-matching-signature' };
};
