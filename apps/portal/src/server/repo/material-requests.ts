import { aliasedTable, and, count, desc, eq, inArray, isNull, type SQL } from 'drizzle-orm';
import { documents, materialRequests, partners, users } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import type { DocProduct, MaterialRequestStatus } from '@/lib/domain';
import type { MaterialRequestDto } from '@/lib/dto';
import { assertCan } from '@/server/auth/policies';
import type { Viewer } from '@/server/auth/types';
import { ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PARTNER_PAGE = 50;
const STAFF_PAGE = 300;

const requester = aliasedTable(users, 'requester');
const assignee = aliasedTable(users, 'assignee');

const selection = {
  row: materialRequests,
  partnerName: partners.name,
  requestedByName: requester.name,
  assignedToName: assignee.name,
  documentTitle: documents.title,
  documentSeen: documents.id,
};

type Joined = {
  row: typeof materialRequests.$inferSelect;
  partnerName: string;
  requestedByName: string;
  assignedToName: string | null;
  documentTitle: string | null;
  documentSeen: string | null;
};

/** The linked document is only reported when the viewer can read it (row level security hides it from partners outside its audience). */
const toDto = ({ row, partnerName, requestedByName, assignedToName, documentTitle, documentSeen }: Joined): MaterialRequestDto => ({
  id: row.id,
  partnerId: row.partnerId,
  partnerName,
  requestedByName,
  subject: row.subject,
  details: row.details,
  product: row.product,
  status: row.status,
  responseNote: row.responseNote,
  documentId: documentSeen ? row.documentId : null,
  documentTitle: documentSeen ? documentTitle : null,
  assignedToId: row.assignedTo,
  assignedToName,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  closedAt: row.closedAt ? row.closedAt.toISOString() : null,
});

const baseQuery = (tx: Tx) =>
  tx
    .select(selection)
    .from(materialRequests)
    .innerJoin(partners, eq(partners.id, materialRequests.partnerId))
    .innerJoin(requester, eq(requester.id, materialRequests.requestedBy))
    .leftJoin(assignee, eq(assignee.id, materialRequests.assignedTo))
    .leftJoin(documents, and(eq(documents.id, materialRequests.documentId), isNull(documents.deletedAt)));

async function loadOne(tx: Tx, id: string): Promise<MaterialRequestDto> {
  const [found] = await baseQuery(tx).where(eq(materialRequests.id, id)).limit(1);
  if (!found) throw new NotFoundError('material request');
  return toDto(found);
}

/** A partner user files a request for their own company. */
export async function createMaterialRequest(
  tx: Tx,
  viewer: Viewer,
  input: { subject: string; details: string; product: DocProduct },
  clock: Clock,
): Promise<MaterialRequestDto> {
  assertCan(viewer, 'document.request_material');
  if (viewer.kind !== 'partner') throw new ForbiddenError('partner only');
  const now = clock.now();
  const [row] = await tx
    .insert(materialRequests)
    .values({
      partnerId: viewer.partnerId,
      requestedBy: viewer.id,
      subject: input.subject.trim(),
      details: input.details.trim(),
      product: input.product,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: materialRequests.id });
  if (!row) throw new Error('material_requests insert returned no row');
  return loadOne(tx, row.id);
}

/** Partner: the company's requests, newest first. Row level security keeps other companies out; the filter is the repo's own. */
export async function listOwnMaterialRequests(tx: Tx, viewer: Viewer): Promise<MaterialRequestDto[]> {
  if (viewer.kind !== 'partner') throw new ForbiddenError('partner only');
  const rows = await baseQuery(tx)
    .where(eq(materialRequests.partnerId, viewer.partnerId))
    .orderBy(desc(materialRequests.createdAt))
    .limit(PARTNER_PAGE);
  return rows.map(toDto);
}

/** Staff with document.manage_requests. Open and in progress first, then newest. */
export async function listMaterialRequests(
  tx: Tx,
  viewer: Viewer,
  input: { status?: MaterialRequestStatus; partnerId?: string },
): Promise<MaterialRequestDto[]> {
  assertCan(viewer, 'document.manage_requests');
  const conditions: Array<SQL | undefined> = [];
  if (input.status) conditions.push(eq(materialRequests.status, input.status));
  if (input.partnerId && UUID_RE.test(input.partnerId)) conditions.push(eq(materialRequests.partnerId, input.partnerId));
  const rows = await baseQuery(tx)
    .where(and(...conditions))
    .orderBy(desc(materialRequests.createdAt))
    .limit(STAFF_PAGE);
  const rank = (status: MaterialRequestStatus): number => (status === 'open' ? 0 : status === 'in_progress' ? 1 : 2);
  return rows.map(toDto).sort((a, b) => rank(a.status) - rank(b.status));
}

/** Staff with document.manage_requests: how many requests wait for a first look (the tab badge). */
export async function countOpenMaterialRequests(tx: Tx, viewer: Viewer): Promise<number> {
  assertCan(viewer, 'document.manage_requests');
  const [row] = await tx.select({ n: count() }).from(materialRequests).where(eq(materialRequests.status, 'open'));
  return row?.n ?? 0;
}

/** Staff who can take a request: active marketing and partner managers. */
export async function listRequestAssignees(tx: Tx, viewer: Viewer): Promise<Array<{ id: string; name: string }>> {
  assertCan(viewer, 'document.manage_requests');
  return tx
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.kind, 'staff'), eq(users.status, 'active'), inArray(users.role, ['marketing', 'partner_manager'])))
    .orderBy(users.name);
}

export interface MaterialRequestPatch {
  id: string;
  status?: MaterialRequestStatus;
  responseNote?: string | null;
  /** undefined keeps it, null unlinks it. */
  documentId?: string | null;
  assignedTo?: string | null;
}

/**
 * Staff with document.manage_requests. A declined request needs a note so the partner learns why; a finished one stamps
 * closed_at and a reopened one clears it. Returns who asked and what the status was so the action can notify them.
 */
export async function updateMaterialRequest(
  tx: Tx,
  viewer: Viewer,
  input: MaterialRequestPatch,
  clock: Clock,
): Promise<{ request: MaterialRequestDto; before: MaterialRequestStatus; requestedBy: string }> {
  assertCan(viewer, 'document.manage_requests');
  if (!UUID_RE.test(input.id)) throw new NotFoundError('material request');
  const [current] = await tx.select().from(materialRequests).where(eq(materialRequests.id, input.id)).for('update');
  if (!current) throw new NotFoundError('material request');

  const status = input.status ?? current.status;
  const responseNote = input.responseNote === undefined ? current.responseNote : input.responseNote?.trim() || null;
  if (status === 'declined' && !responseNote) {
    throw new ValidationError([{ path: 'responseNote', message: 'Tell the partner why this was declined.' }]);
  }
  if (input.documentId) {
    if (!UUID_RE.test(input.documentId)) throw new ValidationError([{ path: 'documentId', message: 'Choose a document from the list.' }]);
    const [doc] = await tx
      .select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.id, input.documentId), isNull(documents.deletedAt)));
    if (!doc) throw new ValidationError([{ path: 'documentId', message: 'Choose a document from the list.' }]);
  }
  if (input.assignedTo) {
    const [person] = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, input.assignedTo), eq(users.kind, 'staff'), eq(users.status, 'active'), inArray(users.role, ['marketing', 'partner_manager'])));
    if (!person) throw new ValidationError([{ path: 'assignedTo', message: 'Choose a person from the list.' }]);
  }

  const closing = status === 'done' || status === 'declined';
  await tx
    .update(materialRequests)
    .set({
      status,
      responseNote,
      documentId: input.documentId === undefined ? current.documentId : input.documentId,
      assignedTo: input.assignedTo === undefined ? current.assignedTo : input.assignedTo,
      updatedAt: clock.now(),
      closedAt: closing ? (current.closedAt && current.status === status ? current.closedAt : clock.now()) : null,
    })
    .where(eq(materialRequests.id, current.id));
  return { request: await loadOne(tx, current.id), before: current.status, requestedBy: current.requestedBy };
}

const PROBE_ID = '00000000-0000-4000-8000-000000000000';

export const isolation = defineIsolation<
  'createMaterialRequest' | 'listOwnMaterialRequests' | 'listMaterialRequests' | 'countOpenMaterialRequests' | 'listRequestAssignees' | 'updateMaterialRequest'
>({
  createMaterialRequest: {
    // A partner can only ever file for its own company: the row's partner is the viewer's, never an input.
    scope: 'tenant',
    expect: 'unchanged',
    probe: (tx, viewer) => createMaterialRequest(tx, viewer, { subject: 'x', details: 'x', product: 'all' }, systemClock),
  },
  listOwnMaterialRequests: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer, ctx) => (await listOwnMaterialRequests(tx, viewer)).filter((r) => r.partnerId === ctx.b.partnerId),
  },
  listMaterialRequests: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => listMaterialRequests(tx, viewer, {}) },
  countOpenMaterialRequests: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => countOpenMaterialRequests(tx, viewer) },
  listRequestAssignees: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => listRequestAssignees(tx, viewer) },
  updateMaterialRequest: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer) => updateMaterialRequest(tx, viewer, { id: PROBE_ID, status: 'done' }, systemClock),
  },
});
