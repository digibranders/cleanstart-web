import type { CollectionSlug, Endpoint } from 'payload';
import { z } from 'zod';

import { hasRole } from '../access/typed-user';
import { clientIpFromHeaders } from '../lib/client-ip';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const bodySchema = z.object({
  fromAuthorId: z.number().int().positive(),
  toAuthorId: z.number().int().positive(),
});

/** Collections that carry an `authors` relationship array. */
const CONTENT_COLLECTIONS = [
  'blogs',
  'news',
  'guides',
  'resources',
  'knowledgeBase',
  'events',
  'webinars',
] as const;

/**
 * POST /api/users/reassign-content
 *
 * Bulk-reassigns all content authored by `fromAuthorId` to `toAuthorId`
 * across all content collections. Used by the ReassignContentAction admin
 * component during author offboarding.
 *
 * Auth: admin only. Returns a count of updated documents per collection.
 */
export const userReassignContentEndpoint: Endpoint = {
  path: '/users/reassign-content',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user, 'admin')) {
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
      return json(
        { ok: false, error: 'invalid_body', issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
        { status: 400 },
      );
    }

    const { fromAuthorId, toAuthorId } = parsed.data;

    if (fromAuthorId === toAuthorId) {
      return json({ ok: false, error: 'same_author' }, { status: 400 });
    }

    // Verify both author records exist.
    const [fromAuthor, toAuthor] = await Promise.all([
      req.payload.findByID({ collection: 'authors', id: fromAuthorId, overrideAccess: true }).catch(() => null),
      req.payload.findByID({ collection: 'authors', id: toAuthorId, overrideAccess: true }).catch(() => null),
    ]);

    if (!fromAuthor) return json({ ok: false, error: 'from_author_not_found' }, { status: 404 });
    if (!toAuthor) return json({ ok: false, error: 'to_author_not_found' }, { status: 404 });

    const summary: Record<string, number> = {};
    let totalUpdated = 0;

    for (const slug of CONTENT_COLLECTIONS) {
      // Find all docs where the authors array contains fromAuthorId.
      const docs = await req.payload.find({
        collection: slug as CollectionSlug,
        where: { authors: { in: [fromAuthorId] } },
        limit: 1000,
        overrideAccess: true,
        depth: 0,
      });

      let updated = 0;
      for (const doc of docs.docs as { id: number; authors?: (number | { id: number })[] }[]) {
        const existingAuthors = doc.authors ?? [];
        const resolvedIds = existingAuthors.map((a) =>
          typeof a === 'object' && a !== null ? a.id : (a as number),
        );

        // Replace fromAuthorId with toAuthorId; deduplicate in case toAuthorId already present.
        const newAuthors = Array.from(
          new Set(resolvedIds.map((id) => (id === fromAuthorId ? toAuthorId : id))),
        );

        await req.payload.update({
          collection: slug as CollectionSlug,
          id: doc.id,
          data: { authors: newAuthors },
          overrideAccess: true,
        });
        updated += 1;
      }

      if (updated > 0) summary[slug] = updated;
      totalUpdated += updated;
    }

    // Audit trail.
    const ip = clientIpFromHeaders(req.headers);
    await req.payload.create({
      collection: 'audit-log',
      data: {
        timestamp: new Date().toISOString(),
        action: 'content_reassigned',
        targetCollection: 'authors',
        targetId: String(fromAuthorId),
        actorUserId: (req.user as { id: number } | null)?.id ?? null,
        requestIp: ip,
        metadata: { fromAuthorId, toAuthorId, totalUpdated, perCollection: summary },
      },
      overrideAccess: true,
    });

    return json({ ok: true, totalUpdated, perCollection: summary });
  },
};
