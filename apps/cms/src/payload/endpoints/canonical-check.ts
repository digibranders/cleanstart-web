import type { Endpoint } from 'payload';

import { checkCanonicalUrl } from '../lib/canonical-check';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

const hasEditorRole = (
  user: { role?: string | null } | null | undefined,
): boolean => user?.role === 'admin' || user?.role === 'editor';

/**
 * GET /api/canonical/health-check?url=https://example.com/article
 *
 * Editor-triggered HEAD-check on a canonical-override URL. Used by
 * the SeoAdvancedPanel to surface a green/amber/red dot next to the
 * canonical input so editors see broken canonicals before publish.
 *
 * Auth: admin or editor only. The endpoint never makes the CMS server
 * fetch arbitrary URLs anonymously — would otherwise be an SSRF vector.
 */
export const canonicalCheckEndpoint: Endpoint = {
  path: '/canonical/health-check',
  method: 'get',
  handler: async (req) => {
    if (!hasEditorRole(req.user as { role?: string } | null)) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const parsed = new URL(req.url ?? '', 'http://internal');
    const url = parsed.searchParams.get('url');
    if (typeof url !== 'string' || url.trim().length === 0) {
      return json(
        { ok: false, error: 'missing_url' },
        { status: 400 },
      );
    }
    const result = await checkCanonicalUrl({ url });
    return json(result, { status: 200 });
  },
};
