import type { PayloadRequest } from 'payload';
import { z } from 'zod';

/**
 * POST /api/consentLog/ingest
 *
 * Service ingestion for cookie-consent decisions relayed by the web CMP
 * (apps/web `/api/consent`). Authenticated with a shared bearer secret
 * (`CONSENT_INGEST_SECRET`), NOT a user session — the web edge has already
 * hashed IP/UA, so this endpoint only validates + persists.
 *
 * Registered as a COLLECTION endpoint on `consentLog` (path relative to
 * /api/consentLog) — config-level endpoints with 3+ path segments are
 * shadowed by Payload's REST router and 404.
 */
const bodySchema = z.object({
  anonymousId: z.string().min(1).max(64),
  decision: z.enum(['accept_all', 'reject_all', 'custom']),
  categories: z.object({ essential: z.literal(true), analytics: z.boolean() }),
  consentVersion: z.number().int().nonnegative(),
  gpc: z.boolean(),
  country: z.string().max(8).optional(),
  ipHash: z.string().max(128).optional(),
  userAgentHash: z.string().max(128).optional(),
});

const respond = (status: number, body?: unknown): Response =>
  body === undefined
    ? new Response(null, { status, headers: { 'cache-control': 'no-store' } })
    : new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      });

export const handleConsentIngest = async (req: PayloadRequest): Promise<Response> => {
  const secret = process.env.CONSENT_INGEST_SECRET;
  if (!secret) return respond(503, { error: 'ingest_disabled' });

  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) return respond(401, { error: 'unauthorized' });

  let raw: unknown;
  try {
    raw = req.json ? await req.json() : null;
  } catch {
    return respond(400, { error: 'invalid_json' });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return respond(400, { error: 'invalid_body' });

  // Omit undefined optional keys — `exactOptionalPropertyTypes` rejects
  // `undefined` for the collection's optional (string | null) fields.
  const { country, ipHash, userAgentHash, ...required } = parsed.data;
  await req.payload.create({
    collection: 'consentLog',
    data: {
      ...required,
      ...(country !== undefined ? { country } : {}),
      ...(ipHash !== undefined ? { ipHash } : {}),
      ...(userAgentHash !== undefined ? { userAgentHash } : {}),
    },
    overrideAccess: true,
  });

  return respond(204);
};
