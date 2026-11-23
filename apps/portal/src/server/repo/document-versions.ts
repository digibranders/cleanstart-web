import { and, asc, eq, gt, isNull } from 'drizzle-orm';
import { documentVersions, documents } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import type { DocumentDto, DocumentVersionDto } from '@/lib/dto';
import { assertCan } from '@/server/auth/policies';
import type { Viewer } from '@/server/auth/types';
import { ConflictError, NotFoundError } from '@/server/errors';
import { OLD_KEY_RETENTION_DAYS } from '@/server/files/rules';
import type { Tx } from './context';
import { getDocument } from './documents';
import { defineIsolation } from './isolation.registry';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY_MS = 86_400_000;
const GONE = 'That file is no longer stored, so this version cannot be restored.';

/** Staff with document.edit. The current file first, then every earlier file still inside its 30 day keep window. */
export async function listDocumentVersions(tx: Tx, viewer: Viewer, input: { id: string }, clock: Clock): Promise<DocumentVersionDto[]> {
  assertCan(viewer, 'document.edit');
  if (!UUID_RE.test(input.id)) throw new NotFoundError('document');
  const [current] = await tx
    .select()
    .from(documents)
    .where(and(eq(documents.id, input.id), isNull(documents.deletedAt)));
  if (!current) throw new NotFoundError('document');
  const kept = await tx
    .select()
    .from(documentVersions)
    .where(and(eq(documentVersions.documentId, input.id), gt(documentVersions.purgeAfter, clock.now())))
    .orderBy(asc(documentVersions.version));
  return [
    {
      version: current.version,
      current: true,
      originalName: current.originalName,
      fileSize: current.fileSize,
      mime: current.mime,
      changeNote: current.changeNote,
      at: current.updatedAt.toISOString(),
      keptUntil: null,
    },
    ...kept
      .map((row) => ({
        version: row.version,
        current: false,
        originalName: row.originalName,
        fileSize: row.fileSize,
        mime: row.mime,
        changeNote: row.changeNote,
        at: row.replacedAt.toISOString(),
        keptUntil: row.purgeAfter.toISOString(),
      }))
      .reverse(),
  ];
}

/**
 * Staff with document.replace. Makes an earlier file current again as a new version number (the file URL, audience and open
 * counts are kept). The file being replaced moves into the kept list for another 30 days. Only a version still inside its
 * keep window whose object `isStored` confirms; otherwise a ConflictError and nothing changes.
 */
export async function restoreDocumentVersion(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; version: number; isStored: (fileKey: string) => Promise<boolean> },
  clock: Clock,
): Promise<{ document: DocumentDto; restoredVersion: number; newVersion: number }> {
  assertCan(viewer, 'document.replace');
  if (!UUID_RE.test(input.id)) throw new NotFoundError('document');
  const [current] = await tx
    .select()
    .from(documents)
    .where(and(eq(documents.id, input.id), isNull(documents.deletedAt)))
    .for('update');
  if (!current) throw new NotFoundError('document');
  const now = clock.now();
  const [old] = await tx
    .select()
    .from(documentVersions)
    .where(and(eq(documentVersions.documentId, current.id), eq(documentVersions.version, input.version), gt(documentVersions.purgeAfter, now)))
    .for('update');
  if (!old) throw new ConflictError('version_not_kept', GONE);
  if (!(await input.isStored(old.fileKey))) throw new ConflictError('version_object_missing', GONE);

  await tx.insert(documentVersions).values({
    documentId: current.id,
    version: current.version,
    fileKey: current.fileKey,
    fileSize: current.fileSize,
    mime: current.mime,
    originalName: current.originalName,
    changeNote: current.changeNote,
    replacedAt: now,
    purgeAfter: new Date(now.getTime() + OLD_KEY_RETENTION_DAYS * DAY_MS),
    replacedBy: viewer.id,
  });
  await tx.delete(documentVersions).where(eq(documentVersions.id, old.id));
  const newVersion = current.version + 1;
  await tx
    .update(documents)
    .set({
      fileKey: old.fileKey,
      fileSize: old.fileSize,
      mime: old.mime,
      originalName: old.originalName,
      version: newVersion,
      changeNote: `Restored from version ${old.version}`,
      uploadedBy: viewer.id,
      updatedAt: now,
    })
    .where(eq(documents.id, current.id));
  return { document: await getDocument(tx, viewer, current.id), restoredVersion: old.version, newVersion };
}

export const isolation = defineIsolation<'listDocumentVersions' | 'restoreDocumentVersion'>({
  listDocumentVersions: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) => listDocumentVersions(tx, viewer, { id: ctx.a.documentId }, systemClock),
  },
  restoreDocumentVersion: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) => restoreDocumentVersion(tx, viewer, { id: ctx.a.documentId, version: 1, isStored: async () => true }, systemClock),
  },
});
