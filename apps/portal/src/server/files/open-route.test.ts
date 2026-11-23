import { beforeEach, describe, expect, it } from 'vitest';
import { documentOpens } from '@/db/schema';
import { asStaff, makeDocument, makePartner, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { IntegrationError } from '@/server/errors';
import { FakeFileStorage } from './fake';
import { handleFileOpen } from './open-route';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');

beforeEach(async () => {
  await resetDb(db);
});

const channelViewer = async () => {
  const partner = await makePartner(db, { category: 'channel' });
  return viewerFor(db, await makeUser(db, { partnerId: partner.id, role: 'sales' }));
};

describe('handleFileOpen', () => {
  it('redirects a partner in the audience to a 60 second download URL and records the open', async () => {
    const viewer = await channelViewer();
    const doc = await makeDocument(db, { originalName: 'Battlecard.pdf' });
    const storage = new FakeFileStorage(clock);
    const res = await handleFileOpen(doc.id, { viewer, storage, clock });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe(`https://fake-r2.test/get/${encodeURIComponent(doc.fileKey)}`);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(storage.presigned).toHaveLength(1);
    expect(storage.presigned[0]).toMatchObject({ kind: 'get', key: doc.fileKey, filename: 'Battlecard.pdf' });
    expect(storage.presigned[0]?.expiresAt.toISOString()).toBe('2026-11-06T14:03:00.000Z');
    expect(await db.select().from(documentOpens)).toHaveLength(1);
  });

  it('answers 404 with the same body for a non-audience partner, an unknown id and a malformed id, and signs nothing', async () => {
    const viewer = await channelViewer();
    const restricted = await makeDocument(db, { audienceKind: 'categories', audienceCategories: ['distributor'] });
    const storage = new FakeFileStorage(clock);
    const bodies: string[] = [];
    for (const id of [restricted.id, '00000000-0000-4000-8000-000000000000', 'nope']) {
      const res = await handleFileOpen(id, { viewer, storage, clock });
      expect(res.status).toBe(404);
      bodies.push(await res.text());
    }
    expect(new Set(bodies).size).toBe(1);
    expect(bodies[0]).toBe(JSON.stringify({ error: 'We could not find that.' }));
    expect(storage.presigned).toHaveLength(0);
    expect(await db.select().from(documentOpens)).toHaveLength(0);
  });

  it('lets staff open any live document without recording an open', async () => {
    const staff = await asStaff(db, 'marketing');
    const doc = await makeDocument(db, { audienceKind: 'categories', audienceCategories: ['channel'] });
    const res = await handleFileOpen(doc.id, { viewer: staff, storage: new FakeFileStorage(clock), clock });
    expect(res.status).toBe(302);
    expect(await db.select().from(documentOpens)).toHaveLength(0);
  });

  it('never puts the R2 key in a failure body, and answers 502 when R2 cannot sign', async () => {
    const viewer = await channelViewer();
    const doc = await makeDocument(db, {});
    const storage = new FakeFileStorage(clock);
    storage.presignGet = async () => {
      throw new IntegrationError('r2', `sign failed for ${doc.fileKey}`);
    };
    const res = await handleFileOpen(doc.id, { viewer, storage, clock });
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain(doc.fileKey);
  });
  it('answers 404 for an unknown id even when R2 is not configured, and 502 only once a file is allowed', async () => {
    const viewer = await channelViewer();
    const doc = await makeDocument(db, {});
    const unconfigured = (): never => {
      throw new IntegrationError('r2', 'R2 is not configured');
    };
    expect((await handleFileOpen('00000000-0000-4000-8000-000000000000', { viewer, storage: unconfigured, clock })).status).toBe(404);
    expect((await handleFileOpen(doc.id, { viewer, storage: unconfigured, clock })).status).toBe(502);
  });
  it('records no open when signing fails, however often the partner retries', async () => {
    const viewer = await channelViewer();
    const doc = await makeDocument(db, {});
    const failing = (): never => {
      throw new IntegrationError('r2', 'R2 is not configured');
    };
    for (let n = 0; n < 3; n += 1) {
      expect((await handleFileOpen(doc.id, { viewer, storage: failing, clock })).status).toBe(502);
    }
    expect(await db.select().from(documentOpens)).toHaveLength(0);
  });
});
