import { type Clock, systemClock } from '@/lib/clock';
import type { DocumentOpenTarget } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { describeError, isPortalError } from '@/server/errors';
import { log } from '@/server/log';
import { withViewer } from '@/server/repo/context';
import { getDocumentForOpen, recordDocumentOpen } from '@/server/repo/documents';
import type { FileStorage } from './storage';

export interface FileOpenDeps {
  viewer: Viewer;
  storage: FileStorage;
  clock?: Clock;
}

/** A JSON error with a user safe message. Unknown errors become a generic 500; the cause is logged, never returned. */
export function fileErrorResponse(error: unknown): Response {
  if (!isPortalError(error)) log.error({ err: error }, 'file open failed unexpectedly');
  const described = describeError(error);
  const status = isPortalError(error) ? error.httpStatus : 500;
  return Response.json({ error: described.message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Audience check, open record, then a 302 to a 60 second presigned GET. The database work is one transaction; the R2
 * signing happens after it commits. The R2 key is never in the response body or headers except inside the signed URL.
 */
export async function handleFileOpen(id: string, deps: FileOpenDeps): Promise<Response> {
  const clock = deps.clock ?? systemClock;
  let target: DocumentOpenTarget;
  try {
    target = await withViewer(deps.viewer, async (tx) => {
      const found = await getDocumentForOpen(tx, deps.viewer, id);
      await recordDocumentOpen(tx, deps.viewer, { id }, clock);
      return found;
    });
  } catch (error) {
    return fileErrorResponse(error);
  }
  try {
    const { url } = await deps.storage.presignGet({ key: target.fileKey, filename: target.originalName });
    return new Response(null, {
      status: 302,
      headers: { Location: url, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' },
    });
  } catch (error) {
    return fileErrorResponse(error);
  }
}
