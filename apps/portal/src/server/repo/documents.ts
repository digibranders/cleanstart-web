import { and, eq, isNull, type SQL, sql } from 'drizzle-orm';
import { documentOpens, documents } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import type { DocumentOpenTarget } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { NotFoundError } from '@/server/errors';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The audience rule in SQL for one partner. Keep in step with documents_select in src/db/rls.sql and with
 * canPartnerOpen in src/server/files/rules.ts (a test in M3.2 runs all three on the same cases).
 */
const audienceAllows = (partnerId: string): SQL =>
  sql`(
    ${documents.audienceKind} = 'all'
    or (${documents.audienceKind} = 'categories'
        and (select p.category from partners p where p.id = ${partnerId}::uuid) = any (${documents.audienceCategories}))
    or (${documents.audienceKind} = 'named'
        and exists (select 1 from document_audience a where a.document_id = ${documents.id} and a.partner_id = ${partnerId}::uuid))
  )`;

/** Not deleted, and for a partner inside the audience. RLS enforces the same; this is the repo layer's own filter. */
const visibleTo = (viewer: Viewer): SQL | undefined =>
  viewer.kind === 'staff' ? isNull(documents.deletedAt) : and(isNull(documents.deletedAt), audienceAllows(viewer.partnerId));

async function findVisible(tx: Tx, viewer: Viewer, id: string): Promise<DocumentOpenTarget | null> {
  if (!UUID_RE.test(id)) return null;
  const [row] = await tx
    .select({ fileKey: documents.fileKey, originalName: documents.originalName, mime: documents.mime })
    .from(documents)
    .where(and(eq(documents.id, id), visibleTo(viewer)))
    .limit(1);
  return row ?? null;
}

/** The file key for a signed URL. NotFoundError for a non-audience partner, a deleted document and an unknown id alike (404, never 403). */
export async function getDocumentForOpen(tx: Tx, viewer: Viewer, id: string): Promise<DocumentOpenTarget> {
  const found = await findVisible(tx, viewer, id);
  if (!found) throw new NotFoundError('document');
  return found;
}

/** Partner users only: records document_opens. Staff opens are ignored. The document must be visible to the viewer. */
export async function recordDocumentOpen(tx: Tx, viewer: Viewer, input: { id: string }, clock: Clock): Promise<void> {
  if (viewer.kind !== 'partner') return;
  const found = await findVisible(tx, viewer, input.id);
  if (!found) throw new NotFoundError('document');
  await tx.insert(documentOpens).values({
    documentId: input.id,
    userId: viewer.id,
    partnerId: viewer.partnerId,
    openedAt: clock.now(),
  });
}

export const isolation = defineIsolation<'getDocumentForOpen' | 'recordDocumentOpen'>({
  getDocumentForOpen: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) => getDocumentForOpen(tx, viewer, ctx.documentForBOnly),
  },
  recordDocumentOpen: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) => recordDocumentOpen(tx, viewer, { id: ctx.documentForBOnly }, systemClock),
  },
});
