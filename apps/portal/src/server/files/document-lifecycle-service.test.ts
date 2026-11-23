import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { auditLog, documentVersions, documents, materialRequests, notifications } from '@/db/schema';
import { asStaff, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { FakeEmailTransport } from '@/server/email/fake';
import { ConflictError, ForbiddenError } from '@/server/errors';
import {
  createDocumentSchema,
  handleCreateDocument,
  handleGetDocumentDetail,
  handleReplaceDocumentFile,
  handleRequestMaterial,
  handleRestoreDocumentVersion,
  handleUpdateDocument,
  handleUpdateMaterialRequest,
  replaceDocumentSchema,
  requestMaterialSchema,
  restoreDocumentVersionSchema,
  updateDocumentSchema,
  updateMaterialRequestSchema,
} from './document-service';
import { FakeFileStorage, fakeRangeFetch } from './fake';
import { documentKey } from './rules';
import { makeActionCtx } from './test-ctx';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
const PDF_HEAD = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];

beforeEach(async () => {
  await resetDb(db);
});

const setup = () => {
  const storage = new FakeFileStorage(clock);
  const transport = new FakeEmailTransport();
  return { storage, transport, deps: { storage, transport, fetchImpl: fakeRangeFetch(storage) } };
};

const createViaService = async (overrides: Record<string, unknown>) => {
  const staff = await asStaff(db, 'marketing');
  const { storage, transport, deps } = setup();
  const t = makeActionCtx(staff, clock);
  const key = documentKey({ documentId: crypto.randomUUID(), version: 1, originalName: 'Guide.pdf' });
  storage.simulateUpload(key, 1000, 'application/pdf', PDF_HEAD);
  const doc = await handleCreateDocument(
    t.ctx,
    createDocumentSchema.parse({
      title: 'Guide',
      type: 'datasheet',
      product: 'all',
      audience: { kind: 'all' },
      file: { key, size: 1000, originalName: 'Guide.pdf' },
      ...overrides,
    }),
    deps,
  );
  await t.flush();
  return { staff, doc, storage, transport, deps };
};

describe('draft documents', () => {
  it('announces nobody when a draft is created, then tells the audience when it is published, once', async () => {
    const partner = await makePartner(db, {});
    const user = await makeUser(db, { partnerId: partner.id, email: 'p@kestrel.test' });
    const { staff, doc, transport } = await createViaService({ status: 'draft' });
    expect(doc.status).toBe('draft');
    expect(await db.select().from(notifications)).toHaveLength(0);
    expect(transport.sent).toHaveLength(0);
    const audit = await db.select().from(auditLog).where(eq(auditLog.event, 'document.uploaded'));
    expect(audit[0]?.note).toContain('saved as a draft');

    const t = makeActionCtx(staff, clock);
    const published = await handleUpdateDocument(t.ctx, updateDocumentSchema.parse({ id: doc.id, status: 'published' }), { transport });
    await t.flush();
    expect(published.status).toBe('published');
    const sent = await db.select().from(notifications);
    expect(sent.map((n) => [n.userId, n.kind])).toEqual([[user.id, 'document_new']]);
    expect(transport.to('p@kestrel.test')).toHaveLength(1);
    expect((await db.select().from(auditLog).where(eq(auditLog.event, 'document.published'))).length).toBe(1);

    const again = makeActionCtx(staff, clock);
    await handleUpdateDocument(again.ctx, updateDocumentSchema.parse({ id: doc.id, title: 'Guide 2' }), { transport });
    await again.flush();
    expect(await db.select().from(notifications)).toHaveLength(1);
  });

  it('audits moving a published document back to draft, and an expiry change, without notifying', async () => {
    const { staff, doc, transport } = await createViaService({});
    const t = makeActionCtx(staff, clock);
    await handleUpdateDocument(t.ctx, updateDocumentSchema.parse({ id: doc.id, status: 'draft', expiresOn: '2027-01-31' }), { transport });
    expect((await db.select().from(auditLog).where(eq(auditLog.event, 'document.unpublished'))).length).toBe(1);
    const expiry = await db.select().from(auditLog).where(eq(auditLog.event, 'document.expiry_changed'));
    expect(expiry[0]?.note).toBe('Hidden from partners from 2027-01-31');
    const [row] = await db.select().from(documents).where(eq(documents.id, doc.id));
    expect(row?.expiresAt?.toISOString()).toBe('2027-01-31T00:00:00.000Z');
    expect(await db.select().from(notifications)).toHaveLength(0);
  });

  it('rejects a malformed expiry date at the schema', () => {
    expect(updateDocumentSchema.safeParse({ id: crypto.randomUUID(), expiresOn: '31/01/2027' }).success).toBe(false);
    expect(updateDocumentSchema.safeParse({ id: crypto.randomUUID(), expiresOn: '2027-02-30x' }).success).toBe(false);
    expect(updateDocumentSchema.safeParse({ id: crypto.randomUUID(), expiresOn: null }).success).toBe(true);
  });
});

describe('versions through the service', () => {
  it('records the change note on replace, and restores a kept version only while its object is in storage', async () => {
    const { staff, doc, storage, deps } = await createViaService({});
    const t = makeActionCtx(staff, clock);
    const key2 = documentKey({ documentId: doc.id, version: 2, originalName: 'Guide v2.pdf' });
    storage.simulateUpload(key2, 500, 'application/pdf', PDF_HEAD);
    await handleReplaceDocumentFile(
      t.ctx,
      replaceDocumentSchema.parse({ id: doc.id, file: { key: key2, size: 500, originalName: 'Guide v2.pdf' }, changeNote: 'New pricing' }),
      deps,
    );
    const audit = await db.select().from(auditLog).where(eq(auditLog.event, 'document.replaced'));
    expect(audit[0]?.note).toContain('New pricing');

    const input = restoreDocumentVersionSchema.parse({ id: doc.id, version: 1 });
    const [kept] = await db.select().from(documentVersions);
    const oldKey = kept?.fileKey ?? '';
    await storage.delete(oldKey);
    await expect(handleRestoreDocumentVersion(t.ctx, input, deps)).rejects.toBeInstanceOf(ConflictError);
    expect((await db.select().from(documentVersions)).length).toBe(1);

    storage.simulateUpload(oldKey, 1000, 'application/pdf', PDF_HEAD);
    const restored = await handleRestoreDocumentVersion(t.ctx, input, deps);
    expect(restored).toMatchObject({ version: 3, originalName: 'Guide.pdf' });
    expect((await db.select().from(auditLog).where(eq(auditLog.event, 'document.version_restored'))).length).toBe(1);

    const detail = await handleGetDocumentDetail(t.ctx, { id: doc.id });
    expect(detail.versions.map((v) => [v.version, v.current])).toEqual([[3, true], [2, false]]);
  });

  it('refuses restore and detail to staff who cannot manage documents', async () => {
    const { doc, deps } = await createViaService({});
    const sales = await asStaff(db, 'sales');
    const t = makeActionCtx(sales, clock);
    await expect(handleRestoreDocumentVersion(t.ctx, { id: doc.id, version: 1 }, deps)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(handleGetDocumentDetail(t.ctx, { id: doc.id })).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('material request status flow through the service', () => {
  const world = async () => {
    const staff = await asStaff(db, 'marketing');
    const partner = await makePartner(db, { name: 'Kestrel Systems' });
    const requester = await makeUser(db, { partnerId: partner.id, role: 'technical', name: 'Aditi Rao' });
    const viewer = await viewerFor(db, requester);
    const { transport } = setup();
    const made = await handleRequestMaterial(makeActionCtx(viewer, clock).ctx, requestMaterialSchema.parse({ subject: 'Rust one pager', request: 'For a bank', product: 'images' }), { transport });
    return { staff, requester, partner, request: made.request };
  };

  it('notifies the requester when the status changes, with the response as the body, and audits it', async () => {
    const { staff, requester, request } = await world();
    const t = makeActionCtx(staff, clock);
    const done = await handleUpdateMaterialRequest(t.ctx, updateMaterialRequestSchema.parse({ id: request.id, status: 'done', responseNote: 'Attached, see the link' }));
    expect(done).toMatchObject({ status: 'done', responseNote: 'Attached, see the link' });
    const sent = await db.select().from(notifications);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      userId: requester.id,
      kind: 'material_request_update',
      title: 'Your material request is done',
      body: 'Attached, see the link',
      link: '/partner/documents#requests',
    });
    const audit = await db.select().from(auditLog).where(eq(auditLog.event, 'document.request_updated'));
    expect(audit[0]).toMatchObject({ kind: 'documents', target: 'Rust one pager, from Kestrel Systems', note: 'Open to Done' });
    expect(t.revalidated).toContain('/partner/documents');
  });

  it('stays quiet when only the assignee or the note changes, and refuses roles that cannot work requests', async () => {
    const { staff, request } = await world();
    const t = makeActionCtx(staff, clock);
    await handleUpdateMaterialRequest(t.ctx, updateMaterialRequestSchema.parse({ id: request.id, assignedTo: staff.id, responseNote: 'Looking' }));
    expect(await db.select().from(notifications)).toHaveLength(0);
    const sales = await asStaff(db, 'sales');
    await expect(handleUpdateMaterialRequest(makeActionCtx(sales, clock).ctx, { id: request.id, status: 'done' })).rejects.toBeInstanceOf(ForbiddenError);
    const [row] = await db.select().from(materialRequests).where(eq(materialRequests.id, request.id));
    expect(row).toMatchObject({ status: 'open', assignedTo: staff.id });
  });
});
