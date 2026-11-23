import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { auditLog, documentVersions, documents, notificationPrefs, notifications } from '@/db/schema';
import { asStaff, makeDocument, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { ROUTES } from '@/lib/routes';
import { FakeEmailTransport } from '@/server/email/fake';
import { ForbiddenError, IntegrationError, ValidationError } from '@/server/errors';
import {
  createDocumentSchema,
  handleCreateDocument,
  handleCreateUploadTicket,
  handleDeleteDocument,
  handleReplaceDocumentFile,
  handleRequestMaterial,
  handleUpdateDocument,
  requestMaterialSchema,
  uploadTicketSchema,
} from './document-service';
import { FakeFileStorage, fakeRangeFetch } from './fake';
import { documentKey, parseDocumentKey } from './rules';
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

const newDocumentInput = (key: string, overrides: Record<string, unknown> = {}) =>
  createDocumentSchema.parse({
    title: 'Pricing guide',
    type: 'datasheet',
    product: 'libraries',
    audience: { kind: 'categories', categories: ['channel'] },
    file: { key, size: 1000, originalName: 'Pricing Guide.pdf' },
    ...overrides,
  });

describe('handleCreateUploadTicket', () => {
  it('issues a ticket for a new document and for a replacement, using the server side content type', async () => {
    const staff = await asStaff(db, 'marketing');
    const { storage, deps } = setup();
    const { ctx } = makeActionCtx(staff, clock);
    const created = await handleCreateUploadTicket(ctx, uploadTicketSchema.parse({ mode: 'create', originalName: 'Pricing Guide.PDF', size: 1000 }), deps);
    expect(parseDocumentKey(created.key)?.version).toBe(1);
    expect(created.headers).toEqual({ 'Content-Type': 'application/pdf' });
    expect(created).toMatchObject({ originalName: 'Pricing Guide.PDF', size: 1000, expiresAt: '2026-11-06T14:12:00.000Z' });
    const doc = await makeDocument(db, {});
    const replaced = await handleCreateUploadTicket(ctx, uploadTicketSchema.parse({ mode: 'replace', documentId: doc.id, originalName: 'v2.pdf', size: 10 }), deps);
    expect(parseDocumentKey(replaced.key)).toEqual({ documentId: doc.id, version: 2 });
    expect(storage.presigned.filter((p) => p.kind === 'put')).toHaveLength(2);
  });

  it('refuses a disallowed type and an oversize file before signing, and anyone who may not upload', async () => {
    const marketing = await asStaff(db, 'marketing');
    const sales = await asStaff(db, 'sales');
    const technical = await viewerFor(db, await makeUser(db, { partnerId: (await makePartner(db, {})).id, role: 'technical' }));
    const { storage, deps } = setup();
    const ticket = (viewer: typeof marketing, raw: unknown) => handleCreateUploadTicket(makeActionCtx(viewer, clock).ctx, uploadTicketSchema.parse(raw), deps);
    await expect(ticket(marketing, { mode: 'create', originalName: 'run.exe', size: 10 })).rejects.toMatchObject({ reason: 'file_type_not_allowed' });
    await expect(ticket(marketing, { mode: 'create', originalName: 'big.pdf', size: 100 * 1024 * 1024 + 1 })).rejects.toMatchObject({ reason: 'file_too_large' });
    await expect(ticket(sales, { mode: 'create', originalName: 'a.pdf', size: 10 })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(handleCreateUploadTicket(makeActionCtx(technical, clock).ctx, uploadTicketSchema.parse({ mode: 'create', originalName: 'a.pdf', size: 10 }), deps)).rejects.toBeInstanceOf(ForbiddenError);
    expect(storage.presigned).toHaveLength(0);
  });
});

describe('handleCreateDocument', () => {
  it('records the document, audits it, notifies the audience, and emails only people who opted in', async () => {
    const staff = await asStaff(db, 'marketing');
    const channel = await makePartner(db, { category: 'channel' });
    const distributor = await makePartner(db, { category: 'distributor' });
    const optedIn = await makeUser(db, { partnerId: channel.id, email: 'in@kestrel.test', name: 'Opt In' });
    const optedOut = await makeUser(db, { partnerId: channel.id, email: 'out@kestrel.test' });
    await makeUser(db, { partnerId: distributor.id });
    await db.insert(notificationPrefs).values({ userId: optedIn.id, category: 'docs', email: true });

    const { storage, transport, deps } = setup();
    const t = makeActionCtx(staff, clock);
    const ticket = await handleCreateUploadTicket(t.ctx, uploadTicketSchema.parse({ mode: 'create', originalName: 'Pricing Guide.pdf', size: 1000 }), deps);
    storage.simulateUpload(ticket.key, 1000, 'application/pdf', PDF_HEAD);
    const doc = await handleCreateDocument(t.ctx, newDocumentInput(ticket.key), deps);
    await t.flush();

    expect(doc).toMatchObject({ title: 'Pricing guide', version: 1, originalName: 'Pricing Guide.pdf' });
    expect(parseDocumentKey(ticket.key)?.documentId).toBe(doc.id);
    expect(t.revalidated).toEqual([ROUTES.admin.documents, ROUTES.partner.documents]);
    const audit = await db.select().from(auditLog).where(eq(auditLog.event, 'document.uploaded'));
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ kind: 'documents', actorId: staff.id, subjectType: 'document', subjectId: doc.id, target: 'Pricing guide' });
    expect(audit[0]?.note).toBe('Datasheet, Clean Libraries, open to Channel');
    const sent = await db.select().from(notifications);
    expect(sent.map((n) => n.userId).sort()).toEqual([optedIn.id, optedOut.id].sort());
    expect(sent[0]).toMatchObject({ kind: 'document_new', link: ROUTES.partner.documents });
    expect(transport.to('in@kestrel.test')).toHaveLength(1);
    expect(transport.to('out@kestrel.test')).toHaveLength(0);
  });

  it('writes nothing when the object is missing or its first bytes are wrong, and never deletes the object', async () => {
    const staff = await asStaff(db, 'partner_manager');
    const { storage, deps } = setup();
    const t = makeActionCtx(staff, clock);
    const missingKey = documentKey({ documentId: crypto.randomUUID(), version: 1, originalName: 'Pricing Guide.pdf' });
    await expect(handleCreateDocument(t.ctx, newDocumentInput(missingKey), deps)).rejects.toMatchObject({ reason: 'file_missing' });
    const wrongKey = documentKey({ documentId: crypto.randomUUID(), version: 1, originalName: 'Pricing Guide.pdf' });
    storage.simulateUpload(wrongKey, 1000, 'application/pdf', [0x4d, 0x5a, 0x90, 0x00]);
    await expect(handleCreateDocument(t.ctx, newDocumentInput(wrongKey), deps)).rejects.toMatchObject({ reason: 'file_type_not_allowed' });
    expect(await db.select().from(documents)).toHaveLength(0);
    expect(await db.select().from(auditLog)).toHaveLength(0);
    expect(storage.deleted).toEqual([]);
  });

  it('refuses a named audience with an unknown partner and an upload used twice, without a second audit entry', async () => {
    const staff = await asStaff(db, 'marketing');
    const { storage, deps } = setup();
    const t = makeActionCtx(staff, clock);
    const key = documentKey({ documentId: crypto.randomUUID(), version: 1, originalName: 'Pricing Guide.pdf' });
    storage.simulateUpload(key, 1000, 'application/pdf', PDF_HEAD);
    await expect(
      handleCreateDocument(t.ctx, newDocumentInput(key, { audience: { kind: 'named', partnerIds: ['00000000-0000-4000-8000-000000000000'] } }), deps),
    ).rejects.toBeInstanceOf(ValidationError);
    await handleCreateDocument(t.ctx, newDocumentInput(key), deps);
    await expect(handleCreateDocument(t.ctx, newDocumentInput(key), deps)).rejects.toBeInstanceOf(ValidationError);
    expect(await db.select().from(auditLog).where(eq(auditLog.event, 'document.uploaded'))).toHaveLength(1);
    expect(storage.deleted).toEqual([]);
  });

  it('is refused for a partner viewer and for staff sales', async () => {
    const sales = await asStaff(db, 'sales');
    const { deps } = setup();
    await expect(handleCreateDocument(makeActionCtx(sales, clock).ctx, newDocumentInput(documentKey({ documentId: crypto.randomUUID(), version: 1, originalName: 'a.pdf' })), deps)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('handleReplaceDocumentFile', () => {
  it('makes version 2, keeps the old file for 30 days, audits it and refuses a stale ticket', async () => {
    const staff = await asStaff(db, 'partner_manager');
    const doc = await makeDocument(db, { originalName: 'old.pdf' });
    const { storage, deps } = setup();
    const t = makeActionCtx(staff, clock);
    const ticket = await handleCreateUploadTicket(t.ctx, uploadTicketSchema.parse({ mode: 'replace', documentId: doc.id, originalName: 'new.pdf', size: 500 }), deps);
    storage.simulateUpload(ticket.key, 500, 'application/pdf', PDF_HEAD);
    const file = { key: ticket.key, size: 500, originalName: 'new.pdf' };
    const replaced = await handleReplaceDocumentFile(t.ctx, { id: doc.id, file }, deps);
    expect(replaced).toMatchObject({ id: doc.id, version: 2, originalName: 'new.pdf' });
    const [version] = await db.select().from(documentVersions).where(eq(documentVersions.documentId, doc.id));
    expect(version).toMatchObject({ version: 1, fileKey: doc.fileKey });
    expect(version?.purgeAfter.toISOString()).toBe('2026-12-06T14:02:00.000Z');
    const audit = await db.select().from(auditLog).where(eq(auditLog.event, 'document.replaced'));
    expect(audit).toHaveLength(1);
    expect(audit[0]?.note).toBe('Version 2 uploaded, link and open count kept');
    await expect(handleReplaceDocumentFile(t.ctx, { id: doc.id, file }, deps)).rejects.toBeInstanceOf(ValidationError);
    expect(storage.deleted).toEqual([]);
  });
});

describe('handleUpdateDocument and handleDeleteDocument', () => {
  it('audits a detail edit and an audience change separately, and nothing for a no-op', async () => {
    const staff = await asStaff(db, 'marketing');
    const partner = await makePartner(db, {});
    const doc = await makeDocument(db, { title: 'Before' });
    const t = makeActionCtx(staff, clock);
    await handleUpdateDocument(t.ctx, { id: doc.id, title: 'After', audience: { kind: 'named', partnerIds: [partner.id] } });
    const events = (await db.select().from(auditLog)).map((a) => a.event).sort();
    expect(events).toEqual(['document.audience_changed', 'document.edited']);
    const changed = (await db.select().from(auditLog).where(eq(auditLog.event, 'document.audience_changed')))[0];
    expect(changed).toMatchObject({ before: 'All partners', after: '1 partner', target: 'After' });
    await handleUpdateDocument(t.ctx, { id: doc.id, title: 'After', audience: { kind: 'named', partnerIds: [partner.id] } });
    expect(await db.select().from(auditLog)).toHaveLength(2);
    expect(t.revalidated).toContain(ROUTES.partner.documents);
  });

  it('soft deletes, audits it, and is refused for a partner', async () => {
    const staff = await asStaff(db, 'marketing');
    const partnerViewer = await viewerFor(db, await makeUser(db, { partnerId: (await makePartner(db, {})).id, role: 'partner_admin' }));
    const doc = await makeDocument(db, { title: 'Doomed' });
    await expect(handleDeleteDocument(makeActionCtx(partnerViewer, clock).ctx, { id: doc.id })).rejects.toBeInstanceOf(ForbiddenError);
    expect(await handleDeleteDocument(makeActionCtx(staff, clock).ctx, { id: doc.id })).toEqual({ title: 'Doomed' });
    const audit = await db.select().from(auditLog).where(eq(auditLog.event, 'document.deleted'));
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ target: 'Doomed', note: 'Partners lost access' });
    const [row] = await db.select().from(documents).where(eq(documents.id, doc.id));
    expect(row?.deletedAt).not.toBeNull();
  });
});

describe('handleRequestMaterial', () => {
  const world = async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', email: 'pm@cleanstart.test', name: 'Gaurav' });
    await makeUser(db, { kind: 'staff', role: 'marketing', email: 'mk@cleanstart.test', name: 'Ishita' });
    const partner = await makePartner(db, { name: 'Kestrel Systems', managerId: manager.id });
    const requester = await makeUser(db, { partnerId: partner.id, role: 'technical', name: 'Aditi Rao', email: 'aditi@kestrel.test' });
    return viewerFor(db, requester);
  };

  it('emails the manager and marketing with the requester as reply-to and the text escaped', async () => {
    const viewer = await world();
    const { transport } = setup();
    const out = await handleRequestMaterial(
      makeActionCtx(viewer, clock).ctx,
      requestMaterialSchema.parse({ request: 'A <b>Rust</b> one pager', product: 'images' }),
      { transport },
    );
    expect(out).toEqual({ sent: true });
    expect(transport.sent).toHaveLength(1);
    const message = transport.sent[0];
    expect(message?.to.map((a) => a.email).sort()).toEqual(['mk@cleanstart.test', 'pm@cleanstart.test']);
    expect(message?.replyTo).toMatchObject({ email: 'aditi@kestrel.test' });
    expect(message?.htmlContent).toContain('&lt;b&gt;Rust&lt;/b&gt;');
    expect(message?.htmlContent).not.toContain('<b>Rust</b>');
    expect(message?.subject + (message?.htmlContent ?? '')).toContain('Kestrel Systems');
  });

  it('tells the partner when the email could not be sent', async () => {
    const viewer = await world();
    const { transport } = setup();
    transport.failNext = 'brevo down';
    await expect(
      handleRequestMaterial(makeActionCtx(viewer, clock).ctx, requestMaterialSchema.parse({ request: 'Anything', product: 'all' }), { transport }),
    ).rejects.toBeInstanceOf(IntegrationError);
  });

  it('is refused for staff and rejects an empty request at the schema', async () => {
    const staff = await asStaff(db, 'marketing');
    await expect(
      handleRequestMaterial(makeActionCtx(staff, clock).ctx, requestMaterialSchema.parse({ request: 'x', product: 'all' }), { transport: new FakeEmailTransport() }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(requestMaterialSchema.safeParse({ request: '   ', product: 'all' }).success).toBe(false);
    expect(requestMaterialSchema.safeParse({ request: 'x', product: 'everything' }).success).toBe(false);
  });
});
