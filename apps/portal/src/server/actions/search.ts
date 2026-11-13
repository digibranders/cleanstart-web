'use server';

import { z } from 'zod';
import type { SearchHitDto } from '@/lib/dto';
import { SEARCH_MIN_CHARS, SEARCH_Q_MAX } from '@/lib/search-pages';
import { assertCan } from '@/server/auth/policies';
import { withViewer } from '@/server/repo/context';
import { searchAll } from '@/server/repo/search';
import { rateLimit } from '@/server/rate-limit';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const schema = z.object({
  q: z.string().trim().max(SEARCH_Q_MAX),
  limit: z.number().int().min(1).max(10).default(5),
});

/** 30 searches in 10 seconds per person: fast typing with the palette's own debounce stays far below it. */
const SEARCH_RATE_LIMIT = { limit: 30, windowSeconds: 10 };

export async function searchAction(raw: unknown): Promise<ActionResult<SearchHitDto[]>> {
  return runViewerAction({ name: 'search.query', schema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'search.use');
    rateLimit(`search:user:${ctx.viewer.id}`, SEARCH_RATE_LIMIT);
    if (input.q.length < SEARCH_MIN_CHARS) return [];
    return withViewer(ctx.viewer, (tx) => searchAll(tx, ctx.viewer, input));
  });
}
