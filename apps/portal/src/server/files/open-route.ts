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
  /** A getter lets a missing R2 configuration surface only after the audience check, so a bad id still answers 404. */
  storage: FileStorage | (() => FileStorage);
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
 * Audience check, then the signed URL, then the open record, then a 302 to the 60 second presigned GET. Each database
 * step is its own short transaction and the R2 signing sits between them, so no R2 call happens inside a transaction
 * and a signing failure records no open. The second transaction re-checks visibility, so a document deleted in
 * between answers 404. The R2 key is never in the response body or headers except inside the signed URL.
 */
export async function handleFileOpen(id: string, deps: FileOpenDeps): Promise<Response> {
  const clock = deps.clock ?? systemClock;
  let target: DocumentOpenTarget;
  try {
    target = await withViewer(deps.viewer, (tx) => getDocumentForOpen(tx, deps.viewer, id));
  } catch (error) {
    return fileErrorResponse(error);
  }
  let url: string;
  try {
    const storage = typeof deps.storage === 'function' ? deps.storage() : deps.storage;
    ({ url } = await storage.presignGet({ key: target.fileKey, filename: target.originalName }));
  } catch (error) {
    return fileErrorResponse(error);
  }
  try {
    await withViewer(deps.viewer, (tx) => recordDocumentOpen(tx, deps.viewer, { id }, clock));
  } catch (error) {
    return fileErrorResponse(error);
  }
  return new Response(null, {
    status: 302,
    headers: { Location: url, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' },
  });
}

/** Only these are shown by the browser itself; every other type is still served as an attachment. */
const isPlayableMime = (mime: string): boolean => mime === 'application/pdf' || mime.startsWith('video/');

/**
 * The inline sibling of handleFileOpen, for the video player and the PDF preview: same audience check, then a 302 to a
 * 60 second presigned GET that the browser may range request (it asks this route again for each range). It records
 * nothing: the player calls handleFilePlayed once per viewing, so seeking does not count as many opens.
 */
export async function handleFileStream(id: string, deps: FileOpenDeps): Promise<Response> {
  try {
    const target = await withViewer(deps.viewer, (tx) => getDocumentForOpen(tx, deps.viewer, id));
    const storage = typeof deps.storage === 'function' ? deps.storage() : deps.storage;
    const { url } = await storage.presignGet({ key: target.fileKey, filename: target.originalName, inline: isPlayableMime(target.mime) });
    return new Response(null, {
      status: 302,
      headers: { Location: url, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' },
    });
  } catch (error) {
    return fileErrorResponse(error);
  }
}

/** One open for this viewer (staff are never counted), 404 for a document outside the audience or deleted. */
export async function handleFilePlayed(id: string, deps: Pick<FileOpenDeps, 'viewer' | 'clock'>): Promise<Response> {
  try {
    await withViewer(deps.viewer, (tx) => recordDocumentOpen(tx, deps.viewer, { id }, deps.clock ?? systemClock));
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return fileErrorResponse(error);
  }
}
