import type { Endpoint } from 'payload';
import { z } from 'zod';

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
 * Boundary schema per CLAUDE.md "Zod at boundaries". Hard-rejects any
 * `?url=` value that isn't a syntactically valid URL or exceeds 2 KiB.
 * The downstream `checkCanonicalUrl` helper then runs the SSRF guard
 * against the parsed value before any fetch fires.
 */
const querySchema = z.object({
  url: z.string().url().max(2048),
});

/**
 * GET /api/canonical/health-check?url=https://example.com/article
 *
 * Editor-triggered HEAD-check on a canonical-override URL. Used by
 * the SeoAdvancedPanel to surface a green/amber/red dot next to the
 * canonical input so editors see broken canonicals before publish.
 *
 * Auth: admin or editor only. The endpoint never makes the CMS server
 * fetch arbitrary URLs anonymously — would otherwise be an SSRF vector.
 * Defence in depth: `checkCanonicalUrl` also runs the SSRF guard
 * (rejects literal private/loopback IPs + reserved hostnames) and
 * uses `redirect: 'manual'` so a 3xx into an internal target can't
 * bypass the guard.
 */
export const canonicalCheckEndpoint: Endpoint = {
  path: '/canonical/health-check',
  method: 'get',
  handler: async (req) => {
    if (!hasEditorRole(req.user as { role?: string } | null)) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const parsed = new URL(req.url ?? '', 'http://internal');
    const validation = querySchema.safeParse({
      url: parsed.searchParams.get('url') ?? '',
    });
    if (!validation.success) {
      return json(
        {
          ok: false,
          error: 'invalid_url',
          issues: validation.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }
    const result = await checkCanonicalUrl({ url: validation.data.url });
    return json(result, { status: 200 });
  },
};
