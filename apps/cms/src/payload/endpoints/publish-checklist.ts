import type { CollectionSlug, Endpoint } from 'payload';

import { hasAnyRole } from '../access/typed-user';
import { runPublishChecks } from '../hooks/publish-gate';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

/**
 * GET /api/[collection]/[id]/checklist
 *
 * Runs the publish-gate checks in read-only mode against the current
 * saved document. Auth-gated to editor and above. Returns the full
 * check list so the PublishChecklistBanner can render the advisory UI
 * without blocking the save path.
 */
export const publishChecklistEndpoint: Endpoint = {
  path: '/:collection/:id/checklist',
  method: 'get',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor', 'author'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }

    const { collection, id } = req.routeParams as { collection?: string; id?: string };

    if (!collection || !id) {
      return json({ ok: false, error: 'missing_params' }, { status: 400 });
    }

    let doc: Record<string, unknown>;
    try {
      doc = (await req.payload.findByID({
        collection: collection as CollectionSlug,
        id,
        overrideAccess: false,
        req,
        depth: 0,
      })) as unknown as Record<string, unknown>;
    } catch {
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    const checks = runPublishChecks(doc, collection);
    const blockerCount = checks.filter((c) => c.severity === 'blocker' && !c.pass).length;
    const warnCount = checks.filter((c) => c.severity === 'warn' && !c.pass).length;

    return json({ ok: true, checks, blockerCount, warnCount });
  },
};
