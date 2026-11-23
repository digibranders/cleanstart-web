import { ROUTES } from '@/lib/routes';
import { getViewer } from '@/server/auth/viewer';
import { RateLimitError } from '@/server/errors';
import { getFileStorage } from '@/server/files/instance';
import { fileErrorResponse, handleFileStream } from '@/server/files/open-route';
import { rateLimit } from '@/server/rate-limit';

/** A browser asks again for every seek, so this is looser than the download route. */
const STREAMS_PER_MINUTE = 600;

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  const viewer = await getViewer();
  if (!viewer) {
    const next = encodeURIComponent(new URL(request.url).pathname);
    return new Response(null, {
      status: 302,
      headers: { Location: `${ROUTES.signIn}?next=${next}`, 'Cache-Control': 'no-store' },
    });
  }
  try {
    rateLimit(`files-stream:user:${viewer.id}`, { limit: STREAMS_PER_MINUTE, windowSeconds: 60 });
    return await handleFileStream(id, { viewer, storage: getFileStorage });
  } catch (error) {
    const response = fileErrorResponse(error);
    if (error instanceof RateLimitError) response.headers.set('Retry-After', String(error.retryAfterSeconds));
    return response;
  }
}

/** Next would answer HEAD from GET; a probe must not sign URLs. */
export function HEAD(): Response {
  return new Response(null, { status: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' } });
}
