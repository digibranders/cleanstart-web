import { getViewer } from '@/server/auth/viewer';
import { RateLimitError } from '@/server/errors';
import { fileErrorResponse, handleFilePlayed } from '@/server/files/open-route';
import { rateLimit } from '@/server/rate-limit';

const PLAYS_PER_MINUTE = 60;

/** The player calls this once per viewing, when playback starts, so the open counts like a download. */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  const viewer = await getViewer();
  if (!viewer) return new Response(null, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  try {
    rateLimit(`files-played:user:${viewer.id}`, { limit: PLAYS_PER_MINUTE, windowSeconds: 60 });
    return await handleFilePlayed(id, { viewer });
  } catch (error) {
    const response = fileErrorResponse(error);
    if (error instanceof RateLimitError) response.headers.set('Retry-After', String(error.retryAfterSeconds));
    return response;
  }
}
