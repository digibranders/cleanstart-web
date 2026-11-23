import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { auditLog, documents } from '@/db/schema';
import { asPartner, asStaff, makeDocument, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { ForbiddenError, ValidationError } from '@/server/errors';
import { FakeFileStorage, fakeRangeFetch } from './fake';
import { handleFileMedia } from './media-route';
import { handleCreateMediaTicket, handleRemoveMedia, handleSetMedia, mediaTicketSchema, removeMediaSchema, setMediaSchema } from './media-service';
import { makeActionCtx } from './test-ctx';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
const VTT = 'WEBVTT\n\n00:00.000 --> 00:02.000\nHello\n';

beforeEach(async () => {
  await resetDb(db);
});

const channelViewer = async () => {
  const partner = await makePartner(db, { category: 'channel' });
  return viewerFor(db, await makeUser(db, { partnerId: partner.id, role: 'sales' }));
};
const video = (over: Record<string, unknown> = {}) =>
  makeDocument(db, { type: 'video', mime: 'video/mp4', originalName: 'Demo.mp4', captionsKey: 'documents/x/media/cap.vtt', posterKey: 'documents/x/media/post.png', ...over });
const textFetch = (body: string, status = 200): typeof fetch => async () => new Response(body, { status });

describe('handleFileMedia', () => {
  it('serves captions as text/vtt from our own origin, uncached, to a partner in the audience', async () => {
    const viewer = await channelViewer();
    const doc = await video();
    const storage = new FakeFileStorage(clock);
    const res = await handleFileMedia(doc.id, 'captions', { viewer, storage, clock, fetchImpl: textFetch(VTT) });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/vtt; charset=utf-8');
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(await res.text()).toBe(VTT);
    expect(storage.presigned[0]).toMatchObject({ key: 'documents/x/media/cap.vtt', inline: true });
  });

  it('redirects a poster request to a short inline URL', async () => {
    const viewer = await channelViewer();
    const doc = await video();
    const storage = new FakeFileStorage(clock);
    const res = await handleFileMedia(doc.id, 'poster', { viewer, storage, clock });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe(`https://fake-r2.test/get/${encodeURIComponent('documents/x/media/post.png')}`);
  });

  it('answers 404 for a video with no such file, another audience, a draft, an expired and a deleted document, and signs nothing', async () => {
    const viewer = await channelViewer();
    const storage = new FakeFileStorage(clock);
    const none = await video({ captionsKey: null, posterKey: null });
    const otherAudience = await video({ audienceKind: 'categories', audienceCategories: ['distributor'] });
    const draft = await video({ status: 'draft' });
    const expired = await video({ expiresAt: new Date('2026-11-01T00:00:00Z') });
    const deleted = await video({ deletedAt: new Date('2026-11-01T00:00:00Z') });
    for (const id of [none.id, otherAudience.id, draft.id, expired.id, deleted.id, '00000000-0000-4000-8000-000000000000', 'nope']) {
      for (const kind of ['captions', 'poster'] as const) {
        expect((await handleFileMedia(id, kind, { viewer, storage, clock, fetchImpl: textFetch(VTT) })).status, `${id} ${kind}`).toBe(404);
      }
    }
    expect(storage.presigned).toHaveLength(0);
  });

  it('lets staff see a draft, and answers an upstream failure with an error, not the body', async () => {
    const staff = await asStaff(db, 'marketing');
    const draft = await video({ status: 'draft' });
    const storage = new FakeFileStorage(clock);
    expect((await handleFileMedia(draft.id, 'captions', { viewer: staff, storage, clock, fetchImpl: textFetch(VTT) })).status).toBe(200);
    expect((await handleFileMedia(draft.id, 'captions', { viewer: staff, storage, clock, fetchImpl: textFetch('nope', 403) })).status).toBeGreaterThanOrEqual(500);
  });

  it('refuses captions over the size limit', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await video();
    const res = await handleFileMedia(doc.id, 'captions', { viewer: staff, storage: new FakeFileStorage(clock), clock, fetchImpl: textFetch('x'.repeat(500 * 1024 + 1)) });
    expect(res.status).toBeGreaterThanOrEqual(500);
  });
});

describe('media actions', () => {
  const setup = () => {
    const storage = new FakeFileStorage(clock);
    return { storage, deps: { storage, fetchImpl: fakeRangeFetch(storage) } };
  };
  const ticketFor = (documentId: string, kind: 'poster' | 'captions', originalName: string, size: number) => mediaTicketSchema.parse({ documentId, kind, originalName, size });

  it('attaches captions: ticket, upload, set, audit, and deletes the file it replaced after the commit', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, { type: 'video', mime: 'video/mp4', originalName: 'Demo.mp4' });
    const { storage, deps } = setup();
    const { ctx, flush, revalidated } = makeActionCtx(staff, clock);

    const ticket = await handleCreateMediaTicket(ctx, ticketFor(doc.id, 'captions', 'Intro.vtt', 40), deps);
    expect(ticket.headers['Content-Type']).toBe('text/vtt');
    storage.simulateUpload(ticket.key, 40, 'text/vtt', Array.from(new TextEncoder().encode(VTT)));
    const set = await handleSetMedia(ctx, setMediaSchema.parse({ id: doc.id, kind: 'captions', file: { key: ticket.key, size: 40, originalName: 'Intro.vtt' } }), deps);
    expect(set.hasCaptions).toBe(true);
    expect(set.hasPoster).toBe(false);
    expect(revalidated.length).toBeGreaterThan(0);

    const second = await handleCreateMediaTicket(ctx, ticketFor(doc.id, 'captions', 'Intro2.vtt', 40), deps);
    storage.simulateUpload(second.key, 40, 'text/vtt', Array.from(new TextEncoder().encode(VTT)));
    await handleSetMedia(ctx, setMediaSchema.parse({ id: doc.id, kind: 'captions', file: { key: second.key, size: 40, originalName: 'Intro2.vtt' } }), deps);
    await flush();
    expect(storage.deleted).toEqual([ticket.key]);

    const removed = await handleRemoveMedia(ctx, removeMediaSchema.parse({ id: doc.id, kind: 'captions' }), deps);
    await flush();
    expect(removed.hasCaptions).toBe(false);
    expect(storage.deleted).toEqual([ticket.key, second.key]);
    const events = (await db.select().from(auditLog).where(eq(auditLog.event, 'document.captions_changed'))).map((r) => r.text);
    expect(events).toHaveLength(3);
    const [row] = await db.select().from(documents).where(eq(documents.id, doc.id));
    expect(row?.captionsKey).toBeNull();
  });

  it('refuses captions that are not WebVTT, and a poster or captions for a document that is not a video', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, { type: 'video', mime: 'video/mp4', originalName: 'Demo.mp4' });
    const sheet = await makeDocument(db, {});
    const { storage, deps } = setup();
    const { ctx } = makeActionCtx(staff, clock);
    const ticket = await handleCreateMediaTicket(ctx, ticketFor(doc.id, 'captions', 'x.vtt', 12), deps);
    storage.simulateUpload(ticket.key, 12, 'text/vtt', Array.from(new TextEncoder().encode('not webvtt..')));
    await expect(handleSetMedia(ctx, setMediaSchema.parse({ id: doc.id, kind: 'captions', file: { key: ticket.key, size: 12, originalName: 'x.vtt' } }), deps)).rejects.toThrow('WEBVTT');
    await expect(handleCreateMediaTicket(ctx, ticketFor(sheet.id, 'poster', 'p.png', 100), deps)).rejects.toBeInstanceOf(ValidationError);
    await expect(handleCreateMediaTicket(ctx, ticketFor(doc.id, 'poster', 'p.png', 3 * 1024 * 1024), deps)).rejects.toThrow('2 MB');
  });

  it('is for staff who can edit documents: partners and sales staff are refused', async () => {
    const doc = await makeDocument(db, { type: 'video', mime: 'video/mp4', originalName: 'Demo.mp4' });
    const { deps } = setup();
    const partner = await asPartner(db, { role: 'partner_admin' });
    const sales = await asStaff(db, 'sales');
    for (const viewer of [partner, sales]) {
      const { ctx } = makeActionCtx(viewer, clock);
      await expect(handleCreateMediaTicket(ctx, ticketFor(doc.id, 'captions', 'x.vtt', 12), deps)).rejects.toBeInstanceOf(ForbiddenError);
      await expect(handleRemoveMedia(ctx, removeMediaSchema.parse({ id: doc.id, kind: 'poster' }), deps)).rejects.toBeInstanceOf(ForbiddenError);
    }
  });
});
