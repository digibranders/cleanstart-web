import { z } from 'zod';
import type { UploadTicketDto } from '@/lib/document-upload';
import type { DocumentDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import type { ActionContext } from '@/server/actions/run';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { ValidationError } from '@/server/errors';
import { log } from '@/server/log';
import { rateLimit } from '@/server/rate-limit';
import { withViewer } from '@/server/repo/context';
import { setDocumentMedia } from '@/server/repo/document-media';
import { getDocument } from '@/server/repo/documents';
import { cleanOriginalName } from './rules';
import { createMediaTicket, MEDIA_KINDS, MEDIA_LABEL, type MediaKind, verifyMedia } from './media';
import type { FileStorage } from './storage';

const TICKETS_PER_HOUR = 60;

const uuid = z.string().uuid();
const kind = z.enum(MEDIA_KINDS);
const fileName = z.string().trim().min(1, 'Choose a file to upload.').max(200);

export const mediaTicketSchema = z.object({ documentId: uuid, kind, originalName: fileName, size: z.number().int().nonnegative() });
export const setMediaSchema = z.object({
  id: uuid,
  kind,
  file: z.object({ key: z.string().min(1).max(300), size: z.number().int().nonnegative(), originalName: fileName }),
});
export const removeMediaSchema = z.object({ id: uuid, kind });

export interface MediaDeps {
  storage: FileStorage;
  /** Tests pass fakeRangeFetch(storage). Production uses the global fetch. */
  fetchImpl?: typeof fetch;
}

const EVENT: Record<MediaKind, 'document.poster_changed' | 'document.captions_changed'> = {
  poster: 'document.poster_changed',
  captions: 'document.captions_changed',
};

/** Step 1: a presigned PUT for a poster or captions file of an existing video. */
export async function handleCreateMediaTicket(ctx: ActionContext, input: z.output<typeof mediaTicketSchema>, deps: MediaDeps): Promise<UploadTicketDto> {
  assertCan(ctx.viewer, 'document.edit');
  rateLimit(`document-media-ticket:user:${ctx.viewer.id}`, { limit: TICKETS_PER_HOUR, windowSeconds: 3600 });
  const doc = await withViewer(ctx.viewer, (tx) => getDocument(tx, ctx.viewer, input.documentId));
  if (doc.type !== 'video') throw new ValidationError([{ path: input.kind, message: 'Only a video can have a poster image or captions.' }]);
  const originalName = cleanOriginalName(input.originalName);
  const { key, put } = await createMediaTicket(deps.storage, { documentId: doc.id, kind: input.kind, originalName, size: input.size });
  return { key, url: put.url, headers: put.headers, expiresAt: put.expiresAt.toISOString(), originalName, size: input.size };
}

/** Step 2: verify the object, point the document at it, audit, then delete the file it replaced. */
export async function handleSetMedia(ctx: ActionContext, input: z.output<typeof setMediaSchema>, deps: MediaDeps): Promise<DocumentDto> {
  assertCan(ctx.viewer, 'document.edit');
  const key = await verifyMedia(deps.storage, { documentId: input.id, kind: input.kind, key: input.file.key, size: input.file.size, originalName: input.file.originalName }, deps.fetchImpl);
  const { doc, previousKey } = await withViewer(ctx.viewer, async (tx) => {
    const out = await setDocumentMedia(tx, ctx.viewer, { id: input.id, kind: input.kind, key }, ctx.clock);
    await recordAudit(tx, ctx.viewer, {
      event: EVENT[input.kind],
      target: out.title,
      note: out.previousKey ? `Replaced the ${MEDIA_LABEL[input.kind]}` : `Added a ${MEDIA_LABEL[input.kind]}`,
      subject: { type: 'document', id: input.id },
    });
    return { doc: await getDocument(tx, ctx.viewer, input.id), previousKey: out.previousKey };
  });
  deleteLater(ctx, deps.storage, previousKey);
  ctx.revalidate(ROUTES.admin.documents);
  ctx.revalidate(ROUTES.partner.documents);
  return doc;
}

export async function handleRemoveMedia(ctx: ActionContext, input: z.output<typeof removeMediaSchema>, deps: Pick<MediaDeps, 'storage'>): Promise<DocumentDto> {
  assertCan(ctx.viewer, 'document.edit');
  const { doc, previousKey } = await withViewer(ctx.viewer, async (tx) => {
    const out = await setDocumentMedia(tx, ctx.viewer, { id: input.id, kind: input.kind, key: null }, ctx.clock);
    if (out.previousKey) {
      await recordAudit(tx, ctx.viewer, {
        event: EVENT[input.kind],
        target: out.title,
        note: `Removed the ${MEDIA_LABEL[input.kind]}`,
        subject: { type: 'document', id: input.id },
      });
    }
    return { doc: await getDocument(tx, ctx.viewer, input.id), previousKey: out.previousKey };
  });
  deleteLater(ctx, deps.storage, previousKey);
  ctx.revalidate(ROUTES.admin.documents);
  ctx.revalidate(ROUTES.partner.documents);
  return doc;
}

/** A replaced object is no longer referenced. Failing to delete it only leaves an orphan, so it is logged and never fails the action. */
function deleteLater(ctx: ActionContext, storage: FileStorage, key: string | null): void {
  if (!key) return;
  ctx.afterCommit(async () => {
    try {
      await storage.delete(key);
    } catch (err) {
      log.warn({ err, key }, 'could not delete a replaced poster or captions object');
    }
  });
}
