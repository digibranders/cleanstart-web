import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { documentOpens, documents } from '@/db/schema';
import { asStaff, makeDocument, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { FakeFileStorage } from './fake';
import { handleFilePlayed, handleFileStream } from './open-route';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');

beforeEach(async () => {
  await resetDb(db);
});

const channelViewer = async () => {
  const partner = await makePartner(db, { category: 'channel' });
  return viewerFor(db, await makeUser(db, { partnerId: partner.id, role: 'sales' }));
};
const restricted = () => makeDocument(db, { audienceKind: 'categories', audienceCategories: ['distributor'] });
const softDelete = (id: string) => db.update(documents).set({ deletedAt: new Date('2026-11-01T00:00:00Z') }).where(eq(documents.id, id));

describe('handleFileStream', () => {
  it('redirects a partner in the audience to an inline 60 second URL for a video and a PDF, and records no open', async () => {
    const viewer = await channelViewer();
    const video = await makeDocument(db, { type: 'video', mime: 'video/mp4', originalName: 'Demo.mp4' });
    const pdf = await makeDocument(db, { originalName: 'Sheet.pdf' });
    const storage = new FakeFileStorage(clock);
    for (const doc of [video, pdf]) {
      const res = await handleFileStream(doc.id, { viewer, storage, clock });
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe(`https://fake-r2.test/get/${encodeURIComponent(doc.fileKey)}`);
      expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    }
    expect(storage.presigned.map((p) => p.inline)).toEqual([true, true]);
    expect(storage.presigned[0]?.expiresAt.toISOString()).toBe('2026-11-06T14:03:00.000Z');
    expect(await db.select().from(documentOpens)).toHaveLength(0);
  });

  it('keeps every other type an attachment, so an uploaded file is never rendered by the portal origin', async () => {
    const viewer = await channelViewer();
    const doc = await makeDocument(db, { mime: 'application/zip', originalName: 'Kit.zip' });
    const storage = new FakeFileStorage(clock);
    expect((await handleFileStream(doc.id, { viewer, storage, clock })).status).toBe(302);
    expect(storage.presigned[0]?.inline).toBe(false);
  });

  it('answers 404 with one body for another audience, a deleted document, an unknown id and a malformed id, and signs nothing', async () => {
    const viewer = await channelViewer();
    const deleted = await makeDocument(db, {});
    await softDelete(deleted.id);
    const storage = new FakeFileStorage(clock);
    const bodies: string[] = [];
    for (const id of [(await restricted()).id, deleted.id, '00000000-0000-4000-8000-000000000000', 'nope']) {
      const res = await handleFileStream(id, { viewer, storage, clock });
      expect(res.status).toBe(404);
      bodies.push(await res.text());
    }
    expect(new Set(bodies).size).toBe(1);
    expect(storage.presigned).toHaveLength(0);
  });

  it('lets staff stream a document outside any partner audience, but not a deleted one', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await restricted();
    const storage = new FakeFileStorage(clock);
    expect((await handleFileStream(doc.id, { viewer: staff, storage, clock })).status).toBe(302);
    await softDelete(doc.id);
    expect((await handleFileStream(doc.id, { viewer: staff, storage, clock })).status).toBe(404);
  });
});

describe('handleFilePlayed', () => {
  it('records one open for the partner company per call', async () => {
    const viewer = await channelViewer();
    const doc = await makeDocument(db, { type: 'video', mime: 'video/mp4' });
    const res = await handleFilePlayed(doc.id, { viewer, clock });
    expect(res.status).toBe(204);
    const rows = await db.select().from(documentOpens);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ documentId: doc.id, userId: viewer.id, openedAt: new Date('2026-11-06T14:02:00Z') });
  });

  it('counts nothing for staff', async () => {
    const staff = await asStaff(db, 'partner_manager');
    const doc = await makeDocument(db, {});
    expect((await handleFilePlayed(doc.id, { viewer: staff, clock })).status).toBe(204);
    expect(await db.select().from(documentOpens)).toHaveLength(0);
  });

  it('answers 404 and counts nothing for another audience and for a deleted document', async () => {
    const viewer = await channelViewer();
    const deleted = await makeDocument(db, {});
    await softDelete(deleted.id);
    for (const id of [(await restricted()).id, deleted.id, 'nope']) {
      expect((await handleFilePlayed(id, { viewer, clock })).status).toBe(404);
    }
    expect(await db.select().from(documentOpens)).toHaveLength(0);
  });
});
