import { describe, expect, it, vi } from 'vitest';
import { fixedClock } from '@/lib/clock';
import { DemoFileStorage } from '@/server/files/demo';

const files = new Map<string, { contentType: string; bytes: Uint8Array }>();
const storage = new DemoFileStorage({
  secret: 'a'.repeat(32),
  baseUrl: 'https://demo.example.net',
  clock: fixedClock('2026-11-17T10:00:00.000Z'),
  store: {
    get: async (key) => files.get(key) ?? null,
    put: async (key, file) => void files.set(key, file),
    delete: async (key) => void files.delete(key),
    titleForKey: async () => null,
    totalBytes: async () => 0,
  },
});
vi.mock('@/server/files/instance', () => ({ getDemoFileStorage: () => storage }));

const { PUT } = await import('./route');

const ticket = async (length: number): Promise<string> => {
  const { url } = await storage.presignPut({ key: 'documents/x/1/plan.pdf', contentType: 'application/pdf', contentLength: length });
  return url;
};
const pdf = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 1, 2, 3, 4, 5, 6]);

describe('PUT /api/demo-files/put', () => {
  it('stores an upload that matches its ticket', async () => {
    const request = new Request(await ticket(pdf.length), { method: 'PUT', headers: { 'content-type': 'application/pdf', 'content-length': String(pdf.length) }, body: pdf });
    expect((await PUT(request)).status).toBe(200);
    expect(files.size).toBe(1);
  });

  it('answers 413 on a declared length that is not the ticket length without reading the body', async () => {
    files.clear();
    const request = new Request(await ticket(pdf.length), { method: 'PUT', headers: { 'content-type': 'application/pdf', 'content-length': '104857600' }, body: pdf });
    const read = vi.spyOn(request, 'arrayBuffer');
    expect((await PUT(request)).status).toBe(413);
    expect(read).not.toHaveBeenCalled();
    expect(files.size).toBe(0);
  });

  it('answers 404 for a bad token before reading anything', async () => {
    const request = new Request('https://demo.example.net/api/demo-files/put?t=nope', { method: 'PUT', headers: { 'content-length': '3' }, body: pdf.subarray(0, 3) });
    const read = vi.spyOn(request, 'arrayBuffer');
    expect((await PUT(request)).status).toBe(404);
    expect(read).not.toHaveBeenCalled();
  });
});
