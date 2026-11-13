import { describe, expect, it, vi } from 'vitest';
import { fixedClock } from '@/lib/clock';
import { IntegrationError } from '@/server/errors';

const mockEnv = vi.hoisted(() => ({
  R2_ENDPOINT: undefined as string | undefined,
  R2_BUCKET: undefined as string | undefined,
  R2_ACCESS_KEY_ID: undefined as string | undefined,
  R2_SECRET_ACCESS_KEY: undefined as string | undefined,
}));
vi.mock('@/env', () => ({ env: mockEnv }));

import { buildR2Client, contentDisposition, createFileStorage, createR2Storage } from './r2';

const CLOCK = fixedClock('2026-11-06T14:02:00Z');

const setup = () => {
  const client = buildR2Client({
    endpoint: 'https://acct.r2.cloudflarestorage.com',
    accessKeyId: 'AKIATEST',
    secretAccessKey: 'secret-test',
  });
  return { client, storage: createR2Storage({ client, bucket: 'test-bucket', clock: CLOCK }) };
};

describe('createR2Storage.presignPut', () => {
  it('signs content type and length and adds no checksum parameters', async () => {
    const { storage } = setup();
    const put = await storage.presignPut({
      key: 'documents/d1/v1/u1-a.pdf',
      contentType: 'application/pdf',
      contentLength: 1234,
    });
    const url = new URL(put.url);
    expect(url.host).toBe('acct.r2.cloudflarestorage.com');
    expect(url.pathname).toBe('/test-bucket/documents/d1/v1/u1-a.pdf');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('600');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe('content-length;content-type;host');
    expect(url.searchParams.has('x-amz-checksum-crc32')).toBe(false);
    expect(url.searchParams.has('x-amz-sdk-checksum-algorithm')).toBe(false);
    expect(put.headers).toEqual({ 'Content-Type': 'application/pdf' });
    expect(put.expiresAt.toISOString()).toBe('2026-11-06T14:12:00.000Z');
  });

  it('caps the expiry at one hour', async () => {
    const { storage } = setup();
    const put = await storage.presignPut({
      key: 'k',
      contentType: 'application/pdf',
      contentLength: 1,
      expiresInSeconds: 99_999,
    });
    expect(new URL(put.url).searchParams.get('X-Amz-Expires')).toBe('3600');
  });
});

describe('createR2Storage.presignGet', () => {
  it('expires in 60 seconds by default and forces a download with the file name', async () => {
    const { storage } = setup();
    const got = await storage.presignGet({ key: 'documents/d1/v1/u1-a.pdf', filename: 'Q3 "plan".pdf' });
    const url = new URL(got.url);
    expect(url.searchParams.get('X-Amz-Expires')).toBe('60');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe('host');
    expect(url.searchParams.get('response-content-disposition')).toBe(
      `attachment; filename="Q3 plan.pdf"; filename*=UTF-8''Q3%20plan.pdf`,
    );
    expect(got.expiresAt.toISOString()).toBe('2026-11-06T14:03:00.000Z');
  });
});

describe('createR2Storage.head and delete', () => {
  it('returns size and content type', async () => {
    const { client, storage } = setup();
    vi.spyOn(client, 'send').mockImplementation(
      async () => ({ ContentLength: 12, ContentType: 'application/pdf' }) as never,
    );
    expect(await storage.head('k')).toEqual({ size: 12, contentType: 'application/pdf' });
  });

  it('returns null when the object does not exist', async () => {
    const { client, storage } = setup();
    vi.spyOn(client, 'send').mockImplementation(async () => {
      throw Object.assign(new Error('NotFound'), { name: 'NotFound', $metadata: { httpStatusCode: 404 } });
    });
    expect(await storage.head('missing')).toBeNull();
  });

  it('wraps any other failure in IntegrationError', async () => {
    const { client, storage } = setup();
    vi.spyOn(client, 'send').mockImplementation(async () => {
      throw Object.assign(new Error('boom'), { name: 'InternalError', $metadata: { httpStatusCode: 500 } });
    });
    await expect(storage.head('k')).rejects.toBeInstanceOf(IntegrationError);
  });

  it('sends a DeleteObject for the bucket and key', async () => {
    const { client, storage } = setup();
    const send = vi.spyOn(client, 'send').mockImplementation(async () => ({}) as never);
    await storage.delete('documents/d1/v1/u1-a.pdf');
    const command = send.mock.calls[0]?.[0] as unknown as { input: Record<string, unknown> };
    expect(command.input).toEqual({ Bucket: 'test-bucket', Key: 'documents/d1/v1/u1-a.pdf' });
  });
});

describe('contentDisposition', () => {
  it('strips quotes and control characters and keeps an ASCII fallback plus the encoded name', () => {
    expect(contentDisposition('a"b\\c\nd.pdf')).toBe(`attachment; filename="abcd.pdf"; filename*=UTF-8''abcd.pdf`);
    expect(contentDisposition('Résumé (v2).pdf')).toBe(
      `attachment; filename="R_sum_ (v2).pdf"; filename*=UTF-8''R%C3%A9sum%C3%A9%20%28v2%29.pdf`,
    );
    expect(contentDisposition('   ')).toBe(`attachment; filename="download"; filename*=UTF-8''download`);
  });
});

describe('createFileStorage', () => {
  it('throws IntegrationError naming R2 when the variables are unset', () => {
    expect(() => createFileStorage()).toThrowError(IntegrationError);
    expect(() => createFileStorage()).toThrowError(/R2/);
  });

  it('builds a storage when every variable is set', () => {
    Object.assign(mockEnv, {
      R2_ENDPOINT: 'https://acct.r2.cloudflarestorage.com',
      R2_BUCKET: 'test-bucket',
      R2_ACCESS_KEY_ID: 'AKIATEST',
      R2_SECRET_ACCESS_KEY: 'secret-test',
    });
    expect(typeof createFileStorage().presignGet).toBe('function');
  });
});
