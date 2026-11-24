import { isChatImage, isChatPdf } from '@/lib/chat';
import { ROUTES } from '@/lib/routes';
import { getViewer } from '@/server/auth/viewer';
import { NotFoundError, RateLimitError } from '@/server/errors';
import { getFileStorage } from '@/server/files/instance';
import { fileErrorResponse } from '@/server/files/open-route';
import { rateLimit } from '@/server/rate-limit';
import { withViewer } from '@/server/repo/context';
import { getAttachment } from '@/server/repo/chat';

export const dynamic = 'force-dynamic';

const OPENS_PER_MINUTE = 120;
const notFound = (): Response => new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });

/**
 * A chat file: membership check on every request, then a 302 to a 60 second presigned GET. Images and PDFs open inline (the
 * thread previews them); everything else downloads. Nothing signed is cached.
 */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  const viewer = await getViewer();
  if (!viewer) {
    const next = encodeURIComponent(new URL(request.url).pathname);
    return new Response(null, { status: 302, headers: { Location: `${ROUTES.signIn}?next=${next}`, 'Cache-Control': 'no-store' } });
  }
  try {
    rateLimit(`chat:files:${viewer.id}`, { limit: OPENS_PER_MINUTE, windowSeconds: 60 });
    const file = await withViewer(viewer, (tx) => getAttachment(tx, viewer, { id }));
    const inline = isChatImage(file.mime) || isChatPdf(file.mime);
    const { url } = await getFileStorage().presignGet({ key: file.key, filename: file.name, inline });
    return new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
  } catch (error) {
    if (error instanceof NotFoundError) return notFound();
    const response = fileErrorResponse(error);
    if (error instanceof RateLimitError) response.headers.set('Retry-After', String(error.retryAfterSeconds));
    return response;
  }
}

/** Link previewers and crawlers must not count as an open. */
export function HEAD(): Response {
  return new Response(null, { status: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' } });
}
