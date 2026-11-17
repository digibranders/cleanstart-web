import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/env', () => ({ env: {} }));

import { buildR2Client, createR2Storage } from './r2';
import { verifyUpload } from './upload';

/**
 * Runs the real R2 adapter against an S3 compatible server (MinIO). Skipped unless PORTAL_S3_TEST=1, so CI is unaffected.
 * Needs PORTAL_S3_ENDPOINT, PORTAL_S3_BUCKET, PORTAL_S3_ACCESS_KEY and PORTAL_S3_SECRET_KEY. MinIO ignores bucket CORS
 * rules (PutBucketCors is NotImplemented), so the documented R2 CORS rule can only be checked on a real R2 bucket.
 */
const enabled = process.env.PORTAL_S3_TEST === '1';
const endpoint = process.env.PORTAL_S3_ENDPOINT ?? 'http://localhost:9100';
const bucket = process.env.PORTAL_S3_BUCKET ?? 'r3m-docs';

const client = buildR2Client({
  endpoint,
  accessKeyId: process.env.PORTAL_S3_ACCESS_KEY ?? 'minioadmin',
  secretAccessKey: process.env.PORTAL_S3_SECRET_KEY ?? 'minioadmin-r3',
});
const storage = createR2Storage({ client, bucket });

const PDF = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(2000, 0x41)]);
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const newKey = (name = 'report.pdf'): string => `documents/${randomUUID()}/v1/${randomUUID()}-${name}`;

async function upload(key: string, body: Buffer, contentType = 'application/pdf'): Promise<Response> {
  const put = await storage.presignPut({ key, contentType, contentLength: body.length });
  return fetch(put.url, { method: 'PUT', headers: put.headers, body: new Uint8Array(body) });
}

const created: string[] = [];
afterAll(async () => {
  if (!enabled) return;
  await Promise.all(created.map((key) => storage.delete(key)));
});

describe.skipIf(!enabled)('R2 adapter against a real S3 server', () => {
  it('uploads through a presigned PUT and heads the stored type and size', async () => {
    const key = newKey();
    created.push(key);
    const res = await upload(key, PDF);
    expect(res.status).toBe(200);
    expect(await storage.head(key)).toEqual({ size: PDF.length, contentType: 'application/pdf' });
  });

  it('rejects a PUT whose content type or length differs from the signed ones', async () => {
    const key = newKey();
    created.push(key);
    const put = await storage.presignPut({ key, contentType: 'application/pdf', contentLength: PDF.length });
    const wrongType = await fetch(put.url, { method: 'PUT', headers: { 'Content-Type': 'text/html' }, body: new Uint8Array(PDF) });
    expect(wrongType.status).toBe(403);
    const wrongLength = await fetch(put.url, { method: 'PUT', headers: put.headers, body: new Uint8Array(PDF.length + 1) });
    expect(wrongLength.status).toBeGreaterThanOrEqual(400);
    expect(await storage.head(key)).toBeNull();
  });

  it('downloads the same bytes through a presigned GET that forces an attachment', async () => {
    const key = newKey();
    created.push(key);
    await upload(key, PDF);
    const { url } = await storage.presignGet({ key, filename: 'Q4 Plan "final".pdf' });
    const res = await fetch(url);
    expect(res.status).toBe(200);
    expect(Buffer.from(await res.arrayBuffer()).equals(PDF)).toBe(true);
    const disposition = res.headers.get('content-disposition') ?? '';
    expect(disposition).toMatch(/^attachment;/);
    expect(disposition).toContain("filename*=UTF-8''Q4%20Plan%20final.pdf");
  });

  it('answers a ranged read with 206 and exactly the requested bytes', async () => {
    const key = newKey();
    created.push(key);
    await upload(key, PDF);
    const { url } = await storage.presignGet({ key, filename: 'a.pdf' });
    const res = await fetch(url, { headers: { Range: 'bytes=0-9' } });
    expect(res.status).toBe(206);
    const body = Buffer.from(await res.arrayBuffer());
    expect(body.length).toBe(10);
    expect(body.equals(PDF.subarray(0, 10))).toBe(true);
    expect(res.headers.get('content-range')).toBe(`bytes 0-9/${PDF.length}`);
  });

  it('lets verifyUpload accept a real PDF and refuse a PDF name holding other bytes', async () => {
    const good = newKey();
    const bad = newKey();
    created.push(good, bad);
    await upload(good, PDF);
    await upload(bad, Buffer.alloc(300, 0x20));
    await expect(verifyUpload(storage, { key: good, size: PDF.length, mime: 'application/pdf', originalName: 'report.pdf' })).resolves.toMatchObject({
      size: PDF.length,
    });
    await expect(verifyUpload(storage, { key: bad, size: 300, mime: 'application/pdf', originalName: 'report.pdf' })).rejects.toMatchObject({
      reason: 'file_type_not_allowed',
    });
    await expect(verifyUpload(storage, { key: newKey(), size: 10, mime: 'application/pdf', originalName: 'report.pdf' })).rejects.toMatchObject({
      reason: 'file_missing',
    });
  });

  it('expires a signed GET URL', async () => {
    const key = newKey();
    created.push(key);
    await upload(key, PDF);
    const { url } = await storage.presignGet({ key, filename: 'a.pdf', expiresInSeconds: 1 });
    expect((await fetch(url)).status).toBe(200);
    await sleep(2500);
    expect((await fetch(url)).status).toBe(403);
  });

  it('answers 404 for a missing key and head returns null', async () => {
    const key = newKey();
    const { url } = await storage.presignGet({ key, filename: 'a.pdf' });
    expect((await fetch(url)).status).toBe(404);
    expect(await storage.head(key)).toBeNull();
  });

  it('rejects a tampered signature and a URL for another key', async () => {
    const key = newKey();
    created.push(key);
    await upload(key, PDF);
    const { url } = await storage.presignGet({ key, filename: 'a.pdf' });
    const tampered = new URL(url);
    const signature = tampered.searchParams.get('X-Amz-Signature') ?? '';
    tampered.searchParams.set('X-Amz-Signature', `${signature.slice(0, -1)}${signature.endsWith('0') ? '1' : '0'}`);
    expect((await fetch(tampered)).status).toBe(403);
    const otherKey = new URL(url);
    otherKey.pathname = otherKey.pathname.replace('/v1/', '/v2/');
    expect((await fetch(otherKey)).status).toBe(403);
  });

  it('deletes an object and tolerates deleting it twice', async () => {
    const key = newKey();
    await upload(key, PDF);
    await storage.delete(key);
    expect(await storage.head(key)).toBeNull();
    await expect(storage.delete(key)).resolves.toBeUndefined();
  });
});
