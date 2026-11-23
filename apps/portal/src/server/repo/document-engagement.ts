import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { documentOpens, documents, partners } from '@/db/schema';
import type { DocumentEngagementDto } from '@/lib/dto';
import { assertCan } from '@/server/auth/policies';
import type { Viewer } from '@/server/auth/types';
import { NotFoundError } from '@/server/errors';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Staff with document.read_stats. Who opened a document (partner, opens, last opened) and which partners its audience
 * reaches that have not. Partners that opened it and have since left the audience still show under "opened".
 */
export async function getDocumentEngagement(tx: Tx, viewer: Viewer, input: { id: string }): Promise<DocumentEngagementDto> {
  assertCan(viewer, 'document.read_stats');
  if (!UUID_RE.test(input.id)) throw new NotFoundError('document');
  const [doc] = await tx
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.id, input.id), isNull(documents.deletedAt)));
  if (!doc) throw new NotFoundError('document');

  const opened = await tx
    .select({
      partnerId: documentOpens.partnerId,
      partnerName: partners.name,
      opens: sql<number>`count(*)::int`,
      lastOpenedAt: sql<Date>`max(${documentOpens.openedAt})`,
    })
    .from(documentOpens)
    .innerJoin(partners, eq(partners.id, documentOpens.partnerId))
    .where(eq(documentOpens.documentId, input.id))
    .groupBy(documentOpens.partnerId, partners.name);
  const openedIds = opened.map((row) => row.partnerId);

  const reached = await tx
    .select({ partnerId: partners.id, partnerName: partners.name })
    .from(partners)
    .innerJoin(documents, eq(documents.id, input.id))
    .where(
      and(
        inArray(partners.status, ['onboarding', 'active']),
        sql`(
          ${documents.audienceKind} = 'all'
          or (${documents.audienceKind} = 'categories' and ${partners.category} = any (${documents.audienceCategories}))
          or (${documents.audienceKind} = 'named'
              and exists (select 1 from document_audience a where a.document_id = ${documents.id} and a.partner_id = ${partners.id}))
        )`,
      ),
    )
    .orderBy(partners.name);

  return {
    openedBy: opened
      .map((row) => ({ ...row, lastOpenedAt: new Date(row.lastOpenedAt).toISOString() }))
      .sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt)),
    notOpened: reached.filter((row) => !openedIds.includes(row.partnerId)),
  };
}

export const isolation = defineIsolation<'getDocumentEngagement'>({
  getDocumentEngagement: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) => getDocumentEngagement(tx, viewer, { id: ctx.a.documentId }),
  },
});
