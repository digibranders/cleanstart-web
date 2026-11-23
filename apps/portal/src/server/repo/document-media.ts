import { and, eq, isNull } from 'drizzle-orm';
import { documents } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import type { Viewer } from '@/server/auth/types';
import { NotFoundError, ValidationError } from '@/server/errors';
import type { MediaKind } from '@/server/files/media';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Staff. Sets (or with key null clears) the poster or captions key of a live video document and returns the key it
 * replaced, so the action can delete that object after the commit. NotFoundError for an unknown or deleted document,
 * ValidationError for a document that is not a video.
 */
export async function setDocumentMedia(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; kind: MediaKind; key: string | null },
  clock: Clock,
): Promise<{ title: string; previousKey: string | null }> {
  assertStaff(viewer);
  if (!UUID_RE.test(input.id)) throw new NotFoundError('document');
  const [current] = await tx
    .select({ title: documents.title, type: documents.type, posterKey: documents.posterKey, captionsKey: documents.captionsKey })
    .from(documents)
    .where(and(eq(documents.id, input.id), isNull(documents.deletedAt)))
    .for('update');
  if (!current) throw new NotFoundError('document');
  if (current.type !== 'video') throw new ValidationError([{ path: input.kind, message: 'Only a video can have a poster image or captions.' }]);
  const previousKey = input.kind === 'poster' ? current.posterKey : current.captionsKey;
  await tx
    .update(documents)
    .set({ ...(input.kind === 'poster' ? { posterKey: input.key } : { captionsKey: input.key }), updatedAt: clock.now() })
    .where(eq(documents.id, input.id));
  return { title: current.title, previousKey };
}

export const isolation = defineIsolation<'setDocumentMedia'>({
  setDocumentMedia: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) => setDocumentMedia(tx, viewer, { id: ctx.a.documentId, kind: 'poster', key: null }, systemClock),
  },
});
