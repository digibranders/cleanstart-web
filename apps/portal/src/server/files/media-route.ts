import type { Viewer } from '@/server/auth/types';
import { getViewer } from '@/server/auth/viewer';
import { IntegrationError, NotFoundError, RateLimitError } from '@/server/errors';
import { rateLimit } from '@/server/rate-limit';
import { withViewer } from '@/server/repo/context';
import { getDocumentForOpen } from '@/server/repo/documents';
import { getFileStorage } from './instance';
import { CAPTIONS_MAX_BYTES, type MediaKind } from './media';
import { fileErrorResponse, type FileOpenDeps } from './open-route';

const MEDIA_PER_MINUTE = 300;

export interface MediaRouteDeps extends FileOpenDeps {
  /** Tests pass a fake. Production uses the global fetch. */
  fetchImpl?: typeof fetch;
  /** Resolves a relative storage URL (demo mode). */
  origin?: string;
}

/**
 * The poster or captions of a video, after the same visibility check as the stream route (404 for a document outside
 * the audience, a draft, an expired or deleted one, and for a video without that file).
 * Poster: a 302 to a short presigned inline GET (the CSP img-src already lists the bucket).
 * Captions: the bytes are read here and served as text/vtt from our own origin, because a <track> needs the same
 * origin and the video itself must stay free of the crossorigin attribute (its stream redirects to the bucket).
 */
export async function handleFileMedia(id: string, kind: MediaKind, deps: MediaRouteDeps): Promise<Response> {
  try {
    const target = await withViewer(deps.viewer, (tx) => getDocumentForOpen(tx, deps.viewer, id));
    const key = kind === 'poster' ? target.posterKey : target.captionsKey;
    if (!key) throw new NotFoundError(kind);
    const storage = typeof deps.storage === 'function' ? deps.storage() : deps.storage;
    const { url } = await storage.presignGet({ key, filename: kind, inline: true, expiresInSeconds: 120 });
    if (kind === 'poster') {
      return new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
    }
    const upstream = await (deps.fetchImpl ?? fetch)(new URL(url, deps.origin ?? 'http://localhost'));
    if (!upstream.ok) throw new IntegrationError('r2', `captions read answered ${upstream.status}`, { status: upstream.status });
    const bytes = new Uint8Array(await upstream.arrayBuffer());
    if (bytes.length > CAPTIONS_MAX_BYTES) throw new IntegrationError('r2', 'captions file is larger than the limit');
    return new Response(bytes, {
      status: 200,
      headers: { 'Content-Type': 'text/vtt; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch (error) {
    return fileErrorResponse(error);
  }
}

/** The route wrapper: sign-in check (401, not a redirect, because a track or image request cannot follow a sign-in page), rate limit, then handleFileMedia. */
export async function serveMedia(request: Request, id: string, kind: MediaKind): Promise<Response> {
  const viewer: Viewer | null = await getViewer();
  if (!viewer) return new Response(null, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  try {
    rateLimit(`files-media:user:${viewer.id}`, { limit: MEDIA_PER_MINUTE, windowSeconds: 60 });
  } catch (error) {
    const response = fileErrorResponse(error);
    if (error instanceof RateLimitError) response.headers.set('Retry-After', String(error.retryAfterSeconds));
    return response;
  }
  return handleFileMedia(id, kind, { viewer, storage: getFileStorage, origin: new URL(request.url).origin });
}
