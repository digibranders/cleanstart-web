import { describe, expect, it } from 'vitest';
import { fixedClock } from '@/lib/clock';
import { FakeFileStorage, fakeRangeFetch } from './fake';

describe('FakeFileStorage', () => {
  it('records presigned URLs and expiries', async () => {
    const storage = new FakeFileStorage(fixedClock('2026-11-06T14:02:00Z'));
    const put = await storage.presignPut({ key: 'k1', contentType: 'application/pdf', contentLength: 5 });
    const got = await storage.presignGet({ key: 'k1', filename: 'a.pdf' });
    expect(put.headers).toEqual({ 'Content-Type': 'application/pdf' });
    expect(put.expiresAt.toISOString()).toBe('2026-11-06T14:12:00.000Z');
    expect(got.expiresAt.toISOString()).toBe('2026-11-06T14:03:00.000Z');
    expect(got.url).toBe('https://fake-r2.test/get/k1');
    expect(storage.presigned).toEqual([
      { kind: 'put', key: 'k1', expiresAt: put.expiresAt },
      { kind: 'get', key: 'k1', expiresAt: got.expiresAt, filename: 'a.pdf' },
    ]);
  });

  it('head sees only simulated uploads and delete removes them', async () => {
    const storage = new FakeFileStorage();
    expect(await storage.head('k')).toBeNull();
    storage.simulateUpload('k', 10, 'application/pdf', [0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(await storage.head('k')).toEqual({ size: 10, contentType: 'application/pdf' });
    await storage.delete('k');
    expect(await storage.head('k')).toBeNull();
    expect(storage.deleted).toEqual(['k']);
  });

  it('fakeRangeFetch serves the first bytes for a presigned get URL', async () => {
    const storage = new FakeFileStorage();
    storage.simulateUpload('documents/a b/x.pdf', 99, 'application/pdf', [1, 2, 3, 4, 5, 6]);
    const { url } = await storage.presignGet({ key: 'documents/a b/x.pdf', filename: 'x.pdf' });
    const res = await fakeRangeFetch(storage)(url, { headers: { Range: 'bytes=0-3' } });
    expect(res.status).toBe(206);
    expect(Array.from(new Uint8Array(await res.arrayBuffer()))).toEqual([1, 2, 3, 4]);
    const missing = await fakeRangeFetch(storage)('https://fake-r2.test/get/nope');
    expect(missing.status).toBe(404);
  });
});
