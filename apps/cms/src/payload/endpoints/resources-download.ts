import type { Endpoint, Payload } from 'payload';

import { clientIpFromHeaders } from '../lib/client-ip';
import { DEFAULT_RATE_LIMITS, checkAndRecord } from '../lib/rate-limit';
import { signDownloadToken, verifyDownloadToken } from '../lib/resources/download-token';
import { readUnlockedIds } from '../lib/resources/unlock-cookie';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

interface ResourceRow {
  id: string | number;
  slug?: string | null;
  gated?: boolean | null;
  asset?: { url?: string | null } | null;
  downloadCount?: number | null;
}

const findResourceBySlug = async (
  payload: Payload,
  slug: string,
): Promise<ResourceRow | null> => {
  const result = (await payload.find({
    collection: 'resources',
    where: { slug: { equals: slug } },
    limit: 1,
    // depth: 1 — populates the `asset` media upload so `asset.url`
    // resolves. depth: 0 only returns the media id (number).
    depth: 1,
    overrideAccess: true,
  })) as { docs: ResourceRow[] };
  return result.docs[0] ?? null;
};

const getSecret = (): string => {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error('PAYLOAD_SECRET is not set');
  return secret;
};

const DEFAULT_ALLOWED_ORIGINS = [
  'https://cleanstart.com',
  'https://www.cleanstart.com',
];

const allowedOrigins = (): string[] => {
  const raw = process.env.LEAD_SUBMIT_ALLOWED_ORIGINS;
  if (!raw || raw.trim().length === 0) return DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

const corsHeadersFor = (origin: string | null): Record<string, string> => {
  if (origin == null || !allowedOrigins().includes(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    vary: 'Origin',
  };
};

/**
 * GET /api/resources/:slug/download?token=<signedToken>
 *
 * Validates the HMAC-signed download token (minted by /api/leads/submit
 * after a successful gated-form submission), increments the resource's
 * downloadCount, and 302s to the R2 asset URL.
 */
export const resourceDownloadEndpoint: Endpoint = {
  path: '/:slug/download',
  method: 'get',
  handler: async (req) => {
    const cors = corsHeadersFor(req.headers.get('origin'));
    const ip = clientIpFromHeaders(req.headers);
    const limit = checkAndRecord(`resource-download:${ip}`, DEFAULT_RATE_LIMITS);
    if (!limit.ok) {
      return json(
        {
          ok: false,
          error: 'rate_limited',
          retryAfterSeconds: Math.ceil(limit.retryAfterMs / 1000),
        },
        { status: 429, headers: cors },
      );
    }

    const slug =
      typeof req.routeParams?.slug === 'string' ? req.routeParams.slug : undefined;
    if (!slug) return json({ ok: false, error: 'missing_slug' }, { status: 400, headers: cors });

    const url = new URL(req.url ?? 'http://localhost/', 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) return json({ ok: false, error: 'missing_token' }, { status: 403, headers: cors });

    const verified = verifyDownloadToken({ token, secret: getSecret() });
    if (!verified.ok) {
      return json(
        { ok: false, error: 'invalid_token', reason: verified.reason },
        { status: 403, headers: cors },
      );
    }

    const resource = await findResourceBySlug(req.payload, slug);
    if (!resource) return json({ ok: false, error: 'not_found' }, { status: 404, headers: cors });

    if (String(resource.id) !== verified.resourceId) {
      return json({ ok: false, error: 'token_resource_mismatch' }, { status: 403, headers: cors });
    }

    const assetUrl = resource.asset?.url;
    if (!assetUrl) return json({ ok: false, error: 'asset_missing' }, { status: 404, headers: cors });

    try {
      await req.payload.update({
        collection: 'resources',
        id: resource.id,
        data: { downloadCount: (resource.downloadCount ?? 0) + 1 },
        overrideAccess: true,
        depth: 0,
      });
    } catch (err) {
      req.payload.logger.warn(
        { err: err instanceof Error ? err.message : String(err), slug },
        'Failed to increment resource downloadCount — proceeding with redirect',
      );
    }

    return Response.redirect(assetUrl, 302);
  },
};

/**
 * GET /api/resources/:slug/token
 *
 * Cookie-bypass path: if the visitor's `cs_gate_unlock` cookie already
 * lists this resource's id, mint a fresh 1-hour download token and
 * return it as JSON. If not, 403 — the client must then open the gate
 * modal.
 */
export const resourceTokenEndpoint: Endpoint = {
  path: '/:slug/token',
  method: 'get',
  handler: async (req) => {
    const cors = corsHeadersFor(req.headers.get('origin'));
    const ip = clientIpFromHeaders(req.headers);
    const limit = checkAndRecord(`resource-token:${ip}`, DEFAULT_RATE_LIMITS);
    if (!limit.ok) {
      return json(
        {
          ok: false,
          error: 'rate_limited',
          retryAfterSeconds: Math.ceil(limit.retryAfterMs / 1000),
        },
        { status: 429, headers: cors },
      );
    }

    const slug =
      typeof req.routeParams?.slug === 'string' ? req.routeParams.slug : undefined;
    if (!slug) return json({ ok: false, error: 'missing_slug' }, { status: 400, headers: cors });

    const resource = await findResourceBySlug(req.payload, slug);
    if (!resource) return json({ ok: false, error: 'not_found' }, { status: 404, headers: cors });

    // Non-gated resources don't need a token — the client should just
    // hit the public asset URL directly. We still return 403 here so
    // there's only one client code path for "no, open the modal/just link".
    if (resource.gated !== true) {
      return json({ ok: false, error: 'not_gated' }, { status: 403, headers: cors });
    }

    const unlocked = readUnlockedIds(req.headers.get('cookie'), getSecret());
    if (!unlocked.includes(String(resource.id))) {
      return json({ ok: false, error: 'not_unlocked' }, { status: 403, headers: cors });
    }

    const { token, expiresAt } = signDownloadToken({
      resourceId: resource.id,
      secret: getSecret(),
    });
    return json(
      {
        ok: true,
        download: { url: `/api/resources/${slug}/download?token=${token}`, expiresAt },
      },
      { headers: cors },
    );
  },
};

