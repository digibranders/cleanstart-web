import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  notLike,
  type SQL,
  sql,
} from 'drizzle-orm';
import {
  type DocumentRow,
  documentAudience,
  documentOpens,
  documentVersions,
  documents,
  partners,
  users,
} from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import {
  type AudienceKind,
  type DocProduct,
  type DocumentType,
  PARTNER_CATEGORIES,
  type PartnerCategory,
} from '@/lib/domain';
import type { DocumentAudienceDto, DocumentDto, DocumentListItemDto, DocumentOpenTarget } from '@/lib/dto';
import { can } from '@/server/auth/policies';
import type { SystemActor, Viewer } from '@/server/auth/types';
import { NotFoundError, ValidationError } from '@/server/errors';
import {
  audienceLabel,
  DELETED_DOCUMENT_RETENTION_DAYS,
  OLD_KEY_RETENTION_DAYS,
  parseDocumentKey,
  PURGED_KEY_PREFIX,
} from '@/server/files/rules';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

export interface UploadedFile {
  key: string;
  size: number;
  mime: string;
  originalName: string;
}

export interface NewDocumentInput {
  title: string;
  type: DocumentType;
  product: DocProduct;
  summary: string | null;
  durationMinutes: number | null;
  audience: { kind: 'all' } | { kind: 'categories'; categories: PartnerCategory[] } | { kind: 'named'; partnerIds: string[] };
  /** From verifyUpload (upload.ts): the object is in R2 and its size and type were checked. */
  file: UploadedFile;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY_MS = 86_400_000;
const BAD_UPLOAD = 'This upload cannot be used. Choose the file again.';
const USED_UPLOAD = 'This upload was already used. Choose the file again.';
const STALE_UPLOAD = 'This document changed while you were uploading. Reload the page and try again.';

const shiftDays = (from: Date, days: number): Date => new Date(from.getTime() + days * DAY_MS);
const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (char) => `\\${char}`);
const orderedCategories = (values: readonly string[]): PartnerCategory[] => PARTNER_CATEGORIES.filter((c) => values.includes(c));

/**
 * The audience rule in SQL for one partner. Keep in step with documents_select in src/db/rls.sql and with
 * canPartnerOpen in src/server/files/rules.ts (documents.test.ts runs all three on the same cases).
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

const toListItem = (row: DocumentRow): DocumentListItemDto => ({
  id: row.id,
  title: row.title,
  type: row.type,
  product: row.product,
  summary: row.summary,
  durationMinutes: row.durationMinutes,
  fileSize: row.fileSize,
  mime: row.mime,
  originalName: row.originalName,
  version: row.version,
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * Adds audience, open counts and the uploader. Only staff who hold document.read_stats get the detail; partners get
 * no audience detail and only their own company's opens; staff without the permission get the same shape with nulls.
 */
async function hydrate(tx: Tx, viewer: Viewer, rows: readonly DocumentRow[]): Promise<DocumentDto[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const staff = viewer.kind === 'staff' && can(viewer, 'document.read_stats');
  const own =
    viewer.kind === 'partner'
      ? sql<number>`(count(*) filter (where ${documentOpens.partnerId} = ${viewer.partnerId}::uuid))::int`
      : sql<number>`0`;
  const stats = await tx
    .select({
      documentId: documentOpens.documentId,
      opens: sql<number>`count(*)::int`,
      partnerCount: sql<number>`count(distinct ${documentOpens.partnerId})::int`,
      own,
    })
    .from(documentOpens)
    .where(inArray(documentOpens.documentId, ids))
    .groupBy(documentOpens.documentId);
  const statsById = new Map(stats.map((s) => [s.documentId, s]));

  const named = staff
    ? await tx
        .select({ documentId: documentAudience.documentId, id: partners.id, name: partners.name })
        .from(documentAudience)
        .innerJoin(partners, eq(partners.id, documentAudience.partnerId))
        .where(inArray(documentAudience.documentId, ids))
        .orderBy(partners.name)
    : [];
  const uploaderIds = [...new Set(rows.flatMap((row) => (row.uploadedBy ? [row.uploadedBy] : [])))];
  const uploaders =
    staff && uploaderIds.length > 0
      ? await tx.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, uploaderIds))
      : [];

  return rows.map((row) => {
    const s = statsById.get(row.id);
    const audience: DocumentAudienceDto = staff
      ? {
          kind: row.audienceKind,
          categories: orderedCategories(row.audienceCategories),
          partners: named.filter((n) => n.documentId === row.id).map((n) => ({ id: n.id, name: n.name })),
        }
      : { kind: row.audienceKind, categories: [], partners: [] };
    return {
      ...toListItem(row),
      audience,
      uploadedByName: staff ? (uploaders.find((u) => u.id === row.uploadedBy)?.name ?? null) : null,
      createdAt: row.createdAt.toISOString(),
      opens: staff ? (s?.opens ?? 0) : null,
      partnerCount: staff ? (s?.partnerCount ?? 0) : null,
      ownOpens: viewer.kind === 'staff' ? null : (s?.own ?? 0),
    };
  });
}

async function hydrateOne(tx: Tx, viewer: Viewer, row: DocumentRow): Promise<DocumentDto> {
  const [dto] = await hydrate(tx, viewer, [row]);
  if (!dto) throw new Error('hydrate returned no document for an existing row');
  return dto;
}

async function findVisible(tx: Tx, viewer: Viewer, id: string): Promise<DocumentOpenTarget | null> {
  if (!UUID_RE.test(id)) return null;
  const [row] = await tx
    .select({ fileKey: documents.fileKey, originalName: documents.originalName, mime: documents.mime })
    .from(documents)
    .where(and(eq(documents.id, id), visibleTo(viewer)))
    .limit(1);
  return row ?? null;
}

/** Locks one live document for a write. NotFoundError for an unknown, malformed or deleted id. */
async function lockLive(tx: Tx, id: string): Promise<DocumentRow> {
  if (!UUID_RE.test(id)) throw new NotFoundError('document');
  const [row] = await tx
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), isNull(documents.deletedAt)))
    .for('update');
  if (!row) throw new NotFoundError('document');
  return row;
}

interface NormalisedAudience {
  kind: AudienceKind;
  categories: PartnerCategory[];
  partnerIds: string[];
}

async function normaliseAudience(tx: Tx, audience: NewDocumentInput['audience']): Promise<NormalisedAudience> {
  if (audience.kind === 'all') return { kind: 'all', categories: [], partnerIds: [] };
  if (audience.kind === 'categories') {
    const categories = orderedCategories(audience.categories);
    if (categories.length === 0) {
      throw new ValidationError([{ path: 'audience.categories', message: 'Pick at least one category.' }]);
    }
    return { kind: 'categories', categories, partnerIds: [] };
  }
  const partnerIds = [...new Set(audience.partnerIds)].sort();
  if (partnerIds.length === 0) {
    throw new ValidationError([{ path: 'audience.partnerIds', message: 'Name at least one partner.' }]);
  }
  const unknown = new ValidationError([{ path: 'audience.partnerIds', message: 'Choose partners from the list.' }]);
  if (!partnerIds.every((partnerId) => UUID_RE.test(partnerId))) throw unknown;
  const found = await tx.select({ id: partners.id }).from(partners).where(inArray(partners.id, partnerIds));
  if (found.length !== partnerIds.length) throw unknown;
  return { kind: 'named', categories: [], partnerIds };
}

const loadNamedPartnerIds = async (tx: Tx, documentId: string): Promise<string[]> =>
  (await tx.select({ id: documentAudience.partnerId }).from(documentAudience).where(eq(documentAudience.documentId, documentId)))
    .map((row) => row.id)
    .sort();

async function assertKeyUnused(tx: Tx, key: string): Promise<void> {
  const inDocuments = await tx.select({ id: documents.id }).from(documents).where(eq(documents.fileKey, key)).limit(1);
  const inVersions = await tx.select({ id: documentVersions.id }).from(documentVersions).where(eq(documentVersions.fileKey, key)).limit(1);
  if (inDocuments.length > 0 || inVersions.length > 0) throw new ValidationError([{ path: 'file', message: USED_UPLOAD }]);
}

/** Partners: only documents their audience allows. Staff: all not deleted. Newest updatedAt first. */
export async function listDocuments(
  tx: Tx,
  viewer: Viewer,
  input: { q?: string; type?: DocumentType; product?: DocProduct },
): Promise<DocumentDto[]> {
  const conditions: Array<SQL | undefined> = [visibleTo(viewer)];
  const needle = input.q?.trim();
  if (needle) conditions.push(ilike(documents.title, `%${escapeLike(needle)}%`));
  if (input.type) conditions.push(eq(documents.type, input.type));
  if (input.product) conditions.push(eq(documents.product, input.product));
  const rows = await tx
    .select()
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.updatedAt), desc(documents.createdAt));
  return hydrate(tx, viewer, rows);
}

/** NotFoundError for a document outside the audience and for a deleted one. */
export async function getDocument(tx: Tx, viewer: Viewer, id: string): Promise<DocumentDto> {
  if (!UUID_RE.test(id)) throw new NotFoundError('document');
  const [row] = await tx
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), visibleTo(viewer)))
    .limit(1);
  if (!row) throw new NotFoundError('document');
  return hydrateOne(tx, viewer, row);
}

/** Recently added or replaced documents (last 30 days) for the Overview "new documents" card. */
export async function listNewDocuments(
  tx: Tx,
  viewer: Viewer,
  input: { limit: number },
  clock: Clock,
): Promise<DocumentListItemDto[]> {
  const since = shiftDays(clock.now(), -30);
  const rows = await tx
    .select()
    .from(documents)
    .where(and(visibleTo(viewer), gte(documents.updatedAt, since)))
    .orderBy(desc(documents.updatedAt))
    .limit(Math.max(1, Math.min(input.limit, 50)));
  return rows.map(toListItem);
}

/** Staff (partner manager, marketing). The document id is the one inside the verified file key. */
export async function createDocument(tx: Tx, viewer: Viewer, input: NewDocumentInput, clock: Clock): Promise<DocumentDto> {
  assertStaff(viewer);
  const key = parseDocumentKey(input.file.key);
  if (!key || key.version !== 1) throw new ValidationError([{ path: 'file', message: BAD_UPLOAD }]);
  const taken = await tx.select({ id: documents.id }).from(documents).where(eq(documents.id, key.documentId)).limit(1);
  if (taken.length > 0) throw new ValidationError([{ path: 'file', message: USED_UPLOAD }]);
  await assertKeyUnused(tx, input.file.key);
  const audience = await normaliseAudience(tx, input.audience);
  const now = clock.now();
  const [row] = await tx
    .insert(documents)
    .values({
      id: key.documentId,
      title: input.title.trim(),
      type: input.type,
      product: input.product,
      summary: input.summary?.trim() || null,
      audienceKind: audience.kind,
      audienceCategories: audience.categories,
      fileKey: input.file.key,
      fileSize: input.file.size,
      mime: input.file.mime,
      originalName: input.file.originalName,
      durationMinutes: input.durationMinutes,
      version: 1,
      uploadedBy: viewer.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new Error('documents insert returned no row');
  if (audience.kind === 'named') {
    await tx.insert(documentAudience).values(audience.partnerIds.map((partnerId) => ({ documentId: row.id, partnerId })));
  }
  return hydrateOne(tx, viewer, row);
}

/** Staff. Version n+1; the old file moves to document_versions with purge_after = now + 30 days. Open counts are kept. */
export async function replaceDocumentFile(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; file: UploadedFile },
  clock: Clock,
): Promise<{ document: DocumentDto; previousVersion: number }> {
  assertStaff(viewer);
  const current = await lockLive(tx, input.id);
  const next = current.version + 1;
  const key = parseDocumentKey(input.file.key);
  if (!key || key.documentId !== current.id || key.version !== next) {
    throw new ValidationError([{ path: 'file', message: STALE_UPLOAD }]);
  }
  await assertKeyUnused(tx, input.file.key);
  const now = clock.now();
  await tx.insert(documentVersions).values({
    documentId: current.id,
    version: current.version,
    fileKey: current.fileKey,
    fileSize: current.fileSize,
    mime: current.mime,
    originalName: current.originalName,
    replacedAt: now,
    purgeAfter: shiftDays(now, OLD_KEY_RETENTION_DAYS),
    replacedBy: viewer.id,
  });
  const [row] = await tx
    .update(documents)
    .set({
      fileKey: input.file.key,
      fileSize: input.file.size,
      mime: input.file.mime,
      originalName: input.file.originalName,
      version: next,
      uploadedBy: viewer.id,
      updatedAt: now,
    })
    .where(eq(documents.id, current.id))
    .returning();
  if (!row) throw new Error('documents update returned no row');
  return { document: await hydrateOne(tx, viewer, row), previousVersion: current.version };
}

/** Staff. Metadata and audience. Returns what changed so the action can write document.edited and document.audience_changed. */
export async function updateDocument(
  tx: Tx,
  viewer: Viewer,
  input: {
    id: string;
    title?: string;
    type?: DocumentType;
    product?: DocProduct;
    summary?: string | null;
    audience?: NewDocumentInput['audience'];
  },
  clock: Clock,
): Promise<{ document: DocumentDto; changed: Array<'details' | 'audience'>; audienceBefore: string; audienceAfter: string }> {
  assertStaff(viewer);
  const current = await lockLive(tx, input.id);
  const currentNamed = await loadNamedPartnerIds(tx, current.id);
  const currentCategories = orderedCategories(current.audienceCategories);
  const audienceBefore = audienceLabel({ kind: current.audienceKind, categories: currentCategories, partners: currentNamed });

  const patch: Partial<typeof documents.$inferInsert> = {};
  if (input.title !== undefined && input.title.trim() !== current.title) patch.title = input.title.trim();
  if (input.type !== undefined && input.type !== current.type) patch.type = input.type;
  if (input.product !== undefined && input.product !== current.product) patch.product = input.product;
  if (input.summary !== undefined) {
    const summary = input.summary?.trim() || null;
    if (summary !== current.summary) patch.summary = summary;
  }
  const changed: Array<'details' | 'audience'> = [];
  if (Object.keys(patch).length > 0) changed.push('details');

  let audienceAfter = audienceBefore;
  let nextNamed = currentNamed;
  if (input.audience !== undefined) {
    const next = await normaliseAudience(tx, input.audience);
    const same =
      next.kind === current.audienceKind &&
      next.categories.join(',') === currentCategories.join(',') &&
      next.partnerIds.join(',') === currentNamed.join(',');
    if (!same) {
      changed.push('audience');
      patch.audienceKind = next.kind;
      patch.audienceCategories = next.categories;
      nextNamed = next.partnerIds;
      audienceAfter = audienceLabel({ kind: next.kind, categories: next.categories, partners: next.partnerIds });
    }
  }
  if (changed.length === 0) {
    return { document: await hydrateOne(tx, viewer, current), changed, audienceBefore, audienceAfter };
  }

  const [row] = await tx
    .update(documents)
    .set({ ...patch, updatedAt: clock.now() })
    .where(eq(documents.id, current.id))
    .returning();
  if (!row) throw new Error('documents update returned no row');
  if (changed.includes('audience')) {
    await tx.delete(documentAudience).where(eq(documentAudience.documentId, current.id));
    if (nextNamed.length > 0) {
      await tx.insert(documentAudience).values(nextNamed.map((partnerId) => ({ documentId: current.id, partnerId })));
    }
  }
  return { document: await hydrateOne(tx, viewer, row), changed, audienceBefore, audienceAfter };
}

/** Staff. Soft delete: sets deleted_at. The file is purged later by the document-purge job. */
export async function deleteDocument(tx: Tx, viewer: Viewer, input: { id: string }, clock: Clock): Promise<{ title: string }> {
  assertStaff(viewer);
  if (!UUID_RE.test(input.id)) throw new NotFoundError('document');
  const [row] = await tx
    .update(documents)
    .set({ deletedAt: clock.now() })
    .where(and(eq(documents.id, input.id), isNull(documents.deletedAt)))
    .returning({ title: documents.title });
  if (!row) throw new NotFoundError('document');
  return { title: row.title };
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

/**
 * Public (system actor, jobs/document-purge.ts). Deletes document_versions past purge_after, and tombstones soft deleted
 * documents older than 30 days (portal_app has no DELETE on documents): their versions and audience rows are deleted and
 * file_key becomes 'purged/<id>'. Returns every R2 key to delete afterwards.
 */
export async function purgeExpiredFiles(tx: Tx, _actor: SystemActor, clock: Clock): Promise<{ keys: string[] }> {
  const now = clock.now();
  const keys: string[] = [];
  const expired = await tx
    .delete(documentVersions)
    .where(lte(documentVersions.purgeAfter, now))
    .returning({ fileKey: documentVersions.fileKey });
  keys.push(...expired.map((row) => row.fileKey));

  const stale = await tx
    .select({ id: documents.id, fileKey: documents.fileKey })
    .from(documents)
    .where(
      and(
        isNotNull(documents.deletedAt),
        lte(documents.deletedAt, shiftDays(now, -DELETED_DOCUMENT_RETENTION_DAYS)),
        notLike(documents.fileKey, `${PURGED_KEY_PREFIX}%`),
      ),
    );
  for (const doc of stale) {
    const versions = await tx
      .delete(documentVersions)
      .where(eq(documentVersions.documentId, doc.id))
      .returning({ fileKey: documentVersions.fileKey });
    keys.push(doc.fileKey, ...versions.map((row) => row.fileKey));
    await tx.delete(documentAudience).where(eq(documentAudience.documentId, doc.id));
    await tx
      .update(documents)
      .set({ fileKey: `${PURGED_KEY_PREFIX}${doc.id}`, fileSize: 0 })
      .where(eq(documents.id, doc.id));
  }
  return { keys };
}

/**
 * Staff. The active users who should hear about a new document: active users of onboarding or active partners that the
 * audience reaches. The action writes one in-app notification each.
 */
export async function listDocumentRecipients(tx: Tx, viewer: Viewer, input: { id: string }): Promise<string[]> {
  assertStaff(viewer);
  if (!UUID_RE.test(input.id)) return [];
  const rows = await tx
    .select({ userId: users.id })
    .from(users)
    .innerJoin(partners, eq(partners.id, users.partnerId))
    .innerJoin(documents, eq(documents.id, input.id))
    .where(
      and(
        eq(users.kind, 'partner'),
        eq(users.status, 'active'),
        inArray(partners.status, ['onboarding', 'active']),
        isNull(documents.deletedAt),
        sql`(
          ${documents.audienceKind} = 'all'
          or (${documents.audienceKind} = 'categories' and ${partners.category} = any (${documents.audienceCategories}))
          or (${documents.audienceKind} = 'named'
              and exists (select 1 from document_audience a where a.document_id = ${documents.id} and a.partner_id = ${partners.id}))
        )`,
      ),
    );
  return rows.map((row) => row.userId);
}

/** Staff. Every partner by name, for the audience picker. Own function so the marketing role, which cannot list partners elsewhere, can use the screen. */
export async function listAudiencePartners(tx: Tx, viewer: Viewer): Promise<Array<{ id: string; name: string }>> {
  assertStaff(viewer);
  const rows = await tx.select({ id: partners.id, name: partners.name }).from(partners).orderBy(partners.name);
  return rows;
}

/** Public (system actor). Who receives a "Request material" email: the partner's manager and every active marketing user, once each. */
export async function listMaterialRequestRecipients(
  tx: Tx,
  _actor: SystemActor,
  input: { partnerId: string },
): Promise<{ recipients: Array<{ email: string; name: string }> }> {
  const manager = await tx
    .select({ email: users.email, name: users.name })
    .from(partners)
    .innerJoin(users, eq(users.id, partners.managerId))
    .where(and(eq(partners.id, input.partnerId), eq(users.status, 'active')));
  const marketing = await tx
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(and(eq(users.kind, 'staff'), eq(users.role, 'marketing'), eq(users.status, 'active')));
  const seen = new Set<string>();
  const recipients = [...manager, ...marketing].filter((person) => {
    const key = person.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { recipients };
}

const PROBE_FILE: UploadedFile = {
  key: 'documents/00000000-0000-4000-8000-000000000000/v1/00000000-0000-4000-8000-000000000001-a.pdf',
  size: 1,
  mime: 'application/pdf',
  originalName: 'a.pdf',
};

export const isolation = defineIsolation<
  | 'listDocuments'
  | 'getDocument'
  | 'listNewDocuments'
  | 'createDocument'
  | 'replaceDocumentFile'
  | 'updateDocument'
  | 'deleteDocument'
  | 'getDocumentForOpen'
  | 'recordDocumentOpen'
  | 'purgeExpiredFiles'
  | 'listDocumentRecipients'
  | 'listAudiencePartners'
  | 'listMaterialRequestRecipients'
>({
  listDocuments: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer, ctx) => (await listDocuments(tx, viewer, {})).filter((d) => d.id === ctx.documentForBOnly),
  },
  getDocument: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => getDocument(tx, viewer, ctx.documentForBOnly) },
  listNewDocuments: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer, ctx) =>
      (await listNewDocuments(tx, viewer, { limit: 50 }, systemClock)).filter((d) => d.id === ctx.documentForBOnly),
  },
  createDocument: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer) =>
      createDocument(
        tx,
        viewer,
        { title: 'x', type: 'datasheet', product: 'all', summary: null, durationMinutes: null, audience: { kind: 'all' }, file: PROBE_FILE },
        systemClock,
      ),
  },
  replaceDocumentFile: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) => replaceDocumentFile(tx, viewer, { id: ctx.a.documentId, file: PROBE_FILE }, systemClock),
  },
  updateDocument: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) => updateDocument(tx, viewer, { id: ctx.a.documentId, title: 'x' }, systemClock),
  },
  deleteDocument: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) => deleteDocument(tx, viewer, { id: ctx.a.documentId }, systemClock),
  },
  getDocumentForOpen: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => getDocumentForOpen(tx, viewer, ctx.documentForBOnly) },
  recordDocumentOpen: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) => recordDocumentOpen(tx, viewer, { id: ctx.documentForBOnly }, systemClock),
  },
  purgeExpiredFiles: { scope: 'public', reason: 'System job (jobs/document-purge.ts) through withSystem; takes a SystemActor, no viewer.' },
  listDocumentRecipients: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) => listDocumentRecipients(tx, viewer, { id: ctx.a.documentId }),
  },
  listAudiencePartners: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => listAudiencePartners(tx, viewer) },
  listMaterialRequestRecipients: {
    scope: 'public',
    reason: 'Called through withSystem by the request material action; takes a SystemActor and returns only staff addresses.',
  },
});
