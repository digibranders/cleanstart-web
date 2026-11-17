import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { type Clock, systemClock } from '@/lib/clock';
import { ConflictError, NotFoundError, ValidationError } from '@/server/errors';
import { placeholderFile } from './demo-placeholder';
import { DOCUMENT_MAX_BYTES } from './rules';
import type { FileStorage, PresignedPut } from './storage';

export const DEMO_FILES_PATH = '/api/demo-files';
const PUT_SECONDS = 600;
const GET_SECONDS = 60;
const SEED_PREFIX = 'seed/';
/** Uploads are kept in the demo database, so they stay small (a Vercel function body is 4.5 MB anyway). */
export const DEMO_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;

/** Where uploaded demo files live. The database one is shared by every serverless instance; tests use a Map. */
export interface DemoFileStore {
  get(key: string): Promise<{ contentType: string; bytes: Uint8Array } | null>;
  put(key: string, file: { contentType: string; bytes: Uint8Array }): Promise<void>;
  delete(key: string): Promise<void>;
  /** The title of the document a seeded key belongs to, for the placeholder text. */
  titleForKey(key: string): Promise<string | null>;
}

const putClaims = z.object({ m: z.literal('put'), k: z.string(), c: z.string(), l: z.number().int().min(0).max(DOCUMENT_MAX_BYTES), e: z.number() });
const getClaims = z.object({ m: z.literal('get'), k: z.string(), f: z.string(), e: z.number() });
type PutClaims = z.infer<typeof putClaims>;
type GetClaims = z.infer<typeof getClaims>;

const sign = (secret: string, payload: string): string => createHmac('sha256', secret).update(payload).digest('base64url');

/** `<base64url claims>.<hmac>`: a capability the way a presigned R2 URL is one, bound to the key, the method and the expiry. */
const seal = (secret: string, claims: PutClaims | GetClaims): string => {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${payload}.${sign(secret, payload)}`;
};

const unseal = (secret: string, token: string, now: Date): unknown => {
  const [payload = '', mac = ''] = token.split('.');
  const expected = Buffer.from(sign(secret, payload));
  const given = Buffer.from(mac);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new NotFoundError('demo file');
  const claims: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  const expires = typeof claims === 'object' && claims !== null && 'e' in claims ? Number((claims as { e: unknown }).e) : 0;
  if (!(expires > now.getTime())) throw new NotFoundError('demo file');
  return claims;
};

/** The demo FileStorage: R2's contract, served by this app (the /api/demo-files routes) from a DemoFileStore. Seeded documents are generated placeholders. */
export class DemoFileStorage implements FileStorage {
  constructor(private readonly deps: { secret: string; baseUrl: string; store: DemoFileStore; clock?: Clock }) {}

  private get clock(): Clock {
    return this.deps.clock ?? systemClock;
  }

  private url(kind: 'put' | 'get', token: string): string {
    return `${this.deps.baseUrl.replace(/\/$/, '')}${DEMO_FILES_PATH}/${kind}?t=${token}`;
  }

  async presignPut(input: { key: string; contentType: string; contentLength: number; expiresInSeconds?: number }): Promise<PresignedPut> {
    const expiresAt = new Date(this.clock.now().getTime() + (input.expiresInSeconds ?? PUT_SECONDS) * 1000);
    const token = seal(this.deps.secret, { m: 'put', k: input.key, c: input.contentType, l: input.contentLength, e: expiresAt.getTime() });
    return { url: this.url('put', token), headers: { 'Content-Type': input.contentType }, expiresAt };
  }

  async presignGet(input: { key: string; filename: string; expiresInSeconds?: number }): Promise<{ url: string; expiresAt: Date }> {
    const expiresAt = new Date(this.clock.now().getTime() + (input.expiresInSeconds ?? GET_SECONDS) * 1000);
    return { url: this.url('get', seal(this.deps.secret, { m: 'get', k: input.key, f: input.filename, e: expiresAt.getTime() })), expiresAt };
  }

  /** The file for a key: an upload from the store, or the placeholder of a seeded document. */
  async read(key: string): Promise<{ contentType: string; bytes: Uint8Array } | null> {
    const stored = await this.deps.store.get(key);
    if (stored) return stored;
    if (!key.startsWith(SEED_PREFIX)) return null;
    return placeholderFile({ key, title: (await this.deps.store.titleForKey(key)) ?? key.slice(SEED_PREFIX.length) });
  }

  async head(key: string): Promise<{ size: number; contentType: string } | null> {
    const file = await this.read(key);
    return file ? { size: file.bytes.length, contentType: file.contentType } : null;
  }

  /** The first bytes, so the upload check needs no HTTP request back to this app. */
  async peek(key: string, length: number): Promise<number[]> {
    return Array.from((await this.read(key))?.bytes.subarray(0, length) ?? []);
  }

  async delete(key: string): Promise<void> {
    await this.deps.store.delete(key);
  }

  /** The PUT route: the token must be a live put token and the request must match the ticket exactly (type and length). */
  async acceptUpload(token: string, contentType: string | null, bytes: Uint8Array): Promise<void> {
    const claims = putClaims.safeParse(unseal(this.deps.secret, token, this.clock.now())).data;
    if (!claims) throw new NotFoundError('demo file');
    if (contentType?.split(';')[0]?.trim().toLowerCase() !== claims.c.toLowerCase()) {
      throw new ValidationError([{ path: 'file', message: 'The file type does not match the upload ticket.' }]);
    }
    if (bytes.length > DEMO_UPLOAD_MAX_BYTES) throw new ValidationError([{ path: 'file', message: 'Files in the demo are limited to 8 MB.' }]);
    if (bytes.length !== claims.l) throw new ConflictError('file_missing', 'The file size does not match the upload ticket.');
    await this.deps.store.put(claims.k, { contentType: claims.c, bytes });
  }

  /** The GET route: the file and the name to download it as. */
  async serveDownload(token: string): Promise<{ contentType: string; bytes: Uint8Array; filename: string }> {
    const claims: GetClaims | undefined = getClaims.safeParse(unseal(this.deps.secret, token, this.clock.now())).data;
    if (!claims) throw new NotFoundError('demo file');
    const file = await this.read(claims.k);
    if (!file) throw new NotFoundError('demo file');
    return { ...file, filename: claims.f };
  }
}
