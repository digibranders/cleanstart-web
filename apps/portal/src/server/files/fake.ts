import { type Clock, systemClock } from '@/lib/clock';
import type { FileStorage, PresignedPut } from './storage';

const PUT_SECONDS = 600;
const GET_SECONDS = 60;
const FAKE_HOST = 'fake-r2.test';

/** In memory FileStorage for tests (contracts J.4). No timers, no network. */
export class FakeFileStorage implements FileStorage {
  /** key -> stored object. Tests put objects here to simulate a finished browser upload. */
  objects = new Map<string, { size: number; contentType: string }>();
  /** The first bytes of each simulated object, read back by fakeRangeFetch for the magic byte check. */
  heads = new Map<string, number[]>();
  deleted: string[] = [];
  /** Every presigned URL handed out. `filename` is set for 'get'. */
  presigned: Array<{ kind: 'put' | 'get'; key: string; expiresAt: Date; filename?: string; inline?: boolean }> = [];
  private readonly clock: Clock;

  constructor(clock: Clock = systemClock) {
    this.clock = clock;
  }

  async presignPut(input: {
    key: string;
    contentType: string;
    contentLength: number;
    expiresInSeconds?: number;
  }): Promise<PresignedPut> {
    const expiresAt = new Date(this.clock.now().getTime() + (input.expiresInSeconds ?? PUT_SECONDS) * 1000);
    this.presigned.push({ kind: 'put', key: input.key, expiresAt });
    return {
      url: `https://${FAKE_HOST}/put/${encodeURIComponent(input.key)}`,
      headers: { 'Content-Type': input.contentType },
      expiresAt,
    };
  }

  async presignGet(input: { key: string; filename: string; inline?: boolean; expiresInSeconds?: number }): Promise<{ url: string; expiresAt: Date }> {
    const expiresAt = new Date(this.clock.now().getTime() + (input.expiresInSeconds ?? GET_SECONDS) * 1000);
    this.presigned.push({ kind: 'get', key: input.key, expiresAt, filename: input.filename, inline: input.inline === true });
    return { url: `https://${FAKE_HOST}/get/${encodeURIComponent(input.key)}`, expiresAt };
  }

  async head(key: string): Promise<{ size: number; contentType: string } | null> {
    return this.objects.get(key) ?? null;
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
    this.heads.delete(key);
    this.deleted.push(key);
  }

  /** Simulates the browser PUT: adds the object so verifyUpload passes. `head` is the file's first bytes. */
  simulateUpload(key: string, size: number, contentType: string, head: ArrayLike<number> = []): void {
    this.objects.set(key, { size, contentType });
    this.heads.set(key, Array.from(head));
  }
}

/** A `fetch` for verifyUpload: answers a Range request on a presigned get URL of the fake from the stored head bytes. */
export const fakeRangeFetch =
  (storage: FakeFileStorage): typeof fetch =>
  async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const prefix = '/get/';
    if (url.hostname !== FAKE_HOST || !url.pathname.startsWith(prefix)) return new Response('bad url', { status: 400 });
    const key = decodeURIComponent(url.pathname.slice(prefix.length));
    const head = storage.heads.get(key);
    if (!storage.objects.has(key) || head === undefined) return new Response('missing', { status: 404 });
    const range = new Headers(init?.headers).get('range') ?? '';
    const match = /^bytes=(\d+)-(\d+)$/.exec(range);
    const end = match ? Number(match[2]) + 1 : head.length;
    return new Response(new Uint8Array(head.slice(0, end)), { status: match ? 206 : 200 });
  };
