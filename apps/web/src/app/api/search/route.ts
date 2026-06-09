import { NextResponse, type NextRequest } from 'next/server';

import { searchContent } from '@/lib/search';

export const runtime = 'nodejs';

/** Below this length a query is too broad to be useful — skip the round trip. */
const MIN_QUERY_LENGTH = 2;
const MAX_LIMIT = 12;

/**
 * GET /api/search?q=<query>&type=<collection>&limit=<n>
 *
 * Same-origin proxy for the client command palette. Keeps the CMS URL/key
 * server-side and lets the browser stay same-origin (no CORS). Delegates to
 * `searchContent`, which talks to the CMS `/api/search` (Meilisearch) and
 * never throws — so this handler always returns `{ hits }`, empty on any
 * failure or too-short query, and never 500s the palette.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  const type = searchParams.get('type') ?? undefined;
  const limitParam = Number.parseInt(searchParams.get('limit') ?? '', 10);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
    : undefined;

  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ hits: [] });
  }

  const hits = await searchContent({
    q,
    ...(type ? { collection: type } : {}),
    ...(limit ? { limit } : {}),
  });

  return NextResponse.json(
    { hits },
    { headers: { 'cache-control': 'private, max-age=15' } },
  );
}
