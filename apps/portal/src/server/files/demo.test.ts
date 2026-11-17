import { describe, expect, it } from 'vitest';
import { fixedClock } from '@/lib/clock';
import { NotFoundError } from '@/server/errors';
import { DEMO_STORE_MAX_BYTES, DemoFileStorage, type DemoFileStore } from './demo';
import { placeholderFile } from './demo-placeholder';
import { documentKey } from './rules';
import { verifyUpload } from './upload';

const NOW = '2026-11-17T10:00:00.000Z';
const DOCUMENT_ID = '11111111-1111-4111-8111-111111111111';
const KEY = documentKey({ documentId: DOCUMENT_ID, version: 1, originalName: 'plan.pdf' });

const memoryStore = (titles: Record<string, string> = {}): DemoFileStore & { files: Map<string, { contentType: string; bytes: Uint8Array }> } => {
  const files = new Map<string, { contentType: string; bytes: Uint8Array }>();
  return {
    files,
    get: async (key) => files.get(key) ?? null,
    put: async (key, file) => void files.set(key, file),
    delete: async (key) => void files.delete(key),
    titleForKey: async (key) => titles[key] ?? null,
    totalBytes: async () => [...files.values()].reduce((sum, file) => sum + file.bytes.length, 0),
  };
};

const build = (clock = fixedClock(NOW), store = memoryStore()) => ({
  store,
  storage: new DemoFileStorage({ secret: 'a'.repeat(32), baseUrl: 'https://demo.example.net/', store, clock }),
});
const tokenOf = (url: string): string => new URL(url).searchParams.get('t') ?? '';
const pdf = (): Uint8Array => Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 1, 2, 3]);

describe('placeholderFile', () => {
  it('is deterministic and has the signature of its extension', () => {
    const a = placeholderFile({ key: 'seed/x.pdf', title: 'Solution sheet' });
    expect(placeholderFile({ key: 'seed/x.pdf', title: 'Solution sheet' }).bytes).toEqual(a.bytes);
    expect(Array.from(a.bytes.subarray(0, 5))).toEqual([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(Array.from(placeholderFile({ key: 'seed/x.zip', title: 't' }).bytes.subarray(0, 4))).toEqual([0x50, 0x4b, 3, 4]);
    expect(Array.from(placeholderFile({ key: 'seed/x.mp4', title: 't' }).bytes.subarray(4, 8))).toEqual([0x66, 0x74, 0x79, 0x70]);
  });

  it('puts a title with brackets and non ASCII text safely into the PDF', () => {
    const text = new TextDecoder().decode(placeholderFile({ key: 'seed/x.pdf', title: 'A (B) \\ café' }).bytes);
    expect(text).toContain('(A \\(B\\) \\\\ caf?)');
  });
});

describe('DemoFileStorage', () => {
  it('signs URLs that point back at this app', async () => {
    const { storage } = build();
    const put = await storage.presignPut({ key: KEY, contentType: 'application/pdf', contentLength: 11 });
    expect(put.url.startsWith('https://demo.example.net/api/demo-files/put?t=')).toBe(true);
    expect(put.headers).toEqual({ 'Content-Type': 'application/pdf' });
    const get = await storage.presignGet({ key: KEY, filename: 'Plan.pdf' });
    expect(get.url.startsWith('https://demo.example.net/api/demo-files/get?t=')).toBe(true);
  });

  it('accepts the upload the ticket describes, so head and peek see it', async () => {
    const { storage, store } = build();
    const { url } = await storage.presignPut({ key: KEY, contentType: 'application/pdf', contentLength: 11 });
    await storage.acceptUpload(tokenOf(url), 'application/pdf', pdf());
    expect(store.files.has(KEY)).toBe(true);
    expect(await storage.head(KEY)).toEqual({ size: 11, contentType: 'application/pdf' });
    expect(await storage.peek(KEY, 5)).toEqual([0x25, 0x50, 0x44, 0x46, 0x2d]);
  });

  it('rejects a different size, a different type, a tampered token, a get token and an expired ticket', async () => {
    const { storage } = build();
    const { url } = await storage.presignPut({ key: KEY, contentType: 'application/pdf', contentLength: 11 });
    const token = tokenOf(url);
    await expect(storage.acceptUpload(token, 'application/pdf', new Uint8Array(12))).rejects.toMatchObject({ reason: 'file_missing' });
    await expect(storage.acceptUpload(token, 'video/mp4', pdf())).rejects.toThrow();
    await expect(storage.acceptUpload(`${token}x`, 'application/pdf', pdf())).rejects.toBeInstanceOf(NotFoundError);
    const get = await storage.presignGet({ key: KEY, filename: 'a.pdf' });
    await expect(storage.acceptUpload(tokenOf(get.url), 'application/pdf', pdf())).rejects.toBeInstanceOf(NotFoundError);
    const put2 = await storage.presignPut({ key: KEY, contentType: 'application/pdf', contentLength: 11 });
    await expect(storage.serveDownload(tokenOf(put2.url))).rejects.toBeInstanceOf(NotFoundError);
    const later = build(fixedClock('2026-11-17T11:00:00.000Z'), memoryStore());
    await expect(later.storage.acceptUpload(token, 'application/pdf', pdf())).rejects.toBeInstanceOf(NotFoundError);
  });

  it('refuses an upload over the demo limit even when the ticket allows it', async () => {
    const { storage } = build();
    const size = 9 * 1024 * 1024;
    const { url } = await storage.presignPut({ key: KEY, contentType: 'application/pdf', contentLength: size });
    await expect(storage.acceptUpload(tokenOf(url), 'application/pdf', new Uint8Array(size))).rejects.toMatchObject({ code: 'validation' });
  });

  it('serves a seeded document as a generated placeholder named after its title, the same bytes every time', async () => {
    const { storage } = build(undefined, memoryStore({ 'seed/sheet.pdf': 'Clean Libraries solution sheet' }));
    const first = await storage.serveDownload(tokenOf((await storage.presignGet({ key: 'seed/sheet.pdf', filename: 'sheet.pdf' })).url));
    const second = await storage.serveDownload(tokenOf((await storage.presignGet({ key: 'seed/sheet.pdf', filename: 'sheet.pdf' })).url));
    expect(first.filename).toBe('sheet.pdf');
    expect(first.contentType).toBe('application/pdf');
    expect(new TextDecoder().decode(first.bytes)).toContain('Clean Libraries solution sheet');
    expect(second.bytes).toEqual(first.bytes);
  });

  it('answers not found for a key that is neither uploaded nor seeded', async () => {
    const { storage } = build();
    expect(await storage.head(KEY)).toBeNull();
    await expect(storage.serveDownload(tokenOf((await storage.presignGet({ key: KEY, filename: 'a.pdf' })).url))).rejects.toBeInstanceOf(NotFoundError);
  });

  it('takes part in verifyUpload without an HTTP request back to the app', async () => {
    const { storage } = build();
    const { url } = await storage.presignPut({ key: KEY, contentType: 'application/pdf', contentLength: 11 });
    await storage.acceptUpload(tokenOf(url), 'application/pdf', pdf());
    const noNetwork = (() => { throw new Error('no fetch expected'); }) as unknown as typeof fetch;
    await expect(verifyUpload(storage, { key: KEY, size: 11, mime: 'application/pdf', originalName: 'plan.pdf' }, { fetchImpl: noNetwork })).resolves.toMatchObject({ key: KEY, size: 11 });
    const wrongType = documentKey({ documentId: DOCUMENT_ID, version: 2, originalName: 'x.pdf' });
    const fake = await storage.presignPut({ key: wrongType, contentType: 'application/pdf', contentLength: 3 });
    await storage.acceptUpload(tokenOf(fake.url), 'application/pdf', Uint8Array.from([1, 2, 3]));
    await expect(verifyUpload(storage, { key: wrongType, size: 3, mime: 'application/pdf', originalName: 'x.pdf' }, { fetchImpl: noNetwork })).rejects.toMatchObject({ reason: 'file_type_not_allowed' });
  });

  it('checks the declared length against the ticket and the demo limit before the body is read', async () => {
    const { storage } = build();
    const { url } = await storage.presignPut({ key: KEY, contentType: 'application/pdf', contentLength: 11 });
    const token = tokenOf(url);
    expect(() => storage.precheckUpload(token, '11')).not.toThrow();
    expect(() => storage.precheckUpload(token, '12')).toThrow(expect.objectContaining({ httpStatus: 413 }));
    expect(() => storage.precheckUpload(token, 'abc')).toThrow(expect.objectContaining({ httpStatus: 413 }));
    expect(() => storage.precheckUpload(token, null)).toThrow(expect.objectContaining({ httpStatus: 411 }));
    expect(() => storage.precheckUpload(`${token}x`, '11')).toThrow(NotFoundError);
    const big = 9 * 1024 * 1024;
    const bigTicket = await storage.presignPut({ key: KEY, contentType: 'application/pdf', contentLength: big });
    expect(() => storage.precheckUpload(tokenOf(bigTicket.url), String(big))).toThrow(expect.objectContaining({ httpStatus: 413 }));
  });

  it('stops storing once the demo holds its total, so the database cannot be filled', async () => {
    const full = memoryStore();
    full.totalBytes = async () => DEMO_STORE_MAX_BYTES - 5;
    const { storage } = build(undefined, full);
    const { url } = await storage.presignPut({ key: KEY, contentType: 'application/pdf', contentLength: 11 });
    await expect(storage.acceptUpload(tokenOf(url), 'application/pdf', pdf())).rejects.toMatchObject({ httpStatus: 413 });
    expect(full.files.has(KEY)).toBe(false);
    full.totalBytes = async () => DEMO_STORE_MAX_BYTES - 11;
    await storage.acceptUpload(tokenOf(url), 'application/pdf', pdf());
    expect(full.files.has(KEY)).toBe(true);
  });
});
