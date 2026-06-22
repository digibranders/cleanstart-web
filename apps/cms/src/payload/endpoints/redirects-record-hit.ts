import type { Endpoint } from 'payload';
import { z } from 'zod';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

const bodySchema = z.object({ from: z.string().min(1).max(2048) });

const HIT_SECRET_HEADER = 'x-redirect-hit-secret';

/**
 * POST /api/redirects/record-hit
 *
 * Records a redirect hit for analytics: increments `hitCount` and stamps
 * `lastHitAt` on the row whose `from` matches the posted path. Called
 * fire-and-forget by apps/web's edge middleware after it issues a redirect.
 *
 * Public (no session) because the middleware calls it without auth. If
 * REDIRECT_HIT_SECRET is set on the CMS, a matching `x-redirect-hit-secret`
 * header is required — the middleware sends it from its own env. Left unset,
 * the endpoint is open (it can only bump a counter on a path that already
 * resolves to a redirect, so the abuse surface is a vanity metric).
 *
 * `overrideAccess` is required because `hitCount`/`lastHitAt` are
 * `update: () => false` for editors — only this endpoint writes them.
 * The read-then-write increment is best-effort: under concurrent hits to
 * the same path a write can be lost, which slightly undercounts. That is
 * acceptable for an analytics counter and matches the resources
 * `downloadCount` pattern.
 */
export const redirectsRecordHitEndpoint: Endpoint = {
  path: '/redirects/record-hit',
  method: 'post',
  handler: async (req) => {
    const secret = process.env.REDIRECT_HIT_SECRET;
    if (secret && req.headers.get(HIT_SECRET_HEADER) !== secret) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }

    let raw: unknown;
    try {
      raw = req.json ? await req.json() : null;
    } catch {
      return json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return json({ ok: false, error: 'invalid_body' }, { status: 400 });
    }

    const result = await req.payload.find({
      collection: 'redirects',
      where: { from: { equals: parsed.data.from } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const row = result.docs[0] as
      | { id: string | number; hitCount?: number | null }
      | undefined;
    if (!row) {
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    try {
      await req.payload.update({
        collection: 'redirects',
        id: row.id,
        data: {
          hitCount: (row.hitCount ?? 0) + 1,
          lastHitAt: new Date().toISOString(),
        },
        overrideAccess: true,
        depth: 0,
      });
    } catch (err) {
      req.payload.logger.warn(
        { err: err instanceof Error ? err.message : String(err), from: parsed.data.from },
        'Failed to increment redirect hitCount',
      );
      return json({ ok: false, error: 'update_failed' }, { status: 500 });
    }

    return json({ ok: true });
  },
};
