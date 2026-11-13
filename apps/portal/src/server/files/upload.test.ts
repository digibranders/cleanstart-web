import { describe, expect, it } from 'vitest';
import { ConflictError, IntegrationError, ValidationError } from '@/server/errors';
import { FakeFileStorage, fakeRangeFetch } from './fake';
import { DOCUMENT_MAX_BYTES, documentKey, parseDocumentKey } from './rules';
import { createUploadTicket, matchesMagic, verifyUpload } from './upload';

const PDF_HEAD = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];
const ZIP_HEAD = [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00];
const MP4_HEAD = [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d];
const DOCUMENT_ID = '11111111-1111-4111-8111-111111111111';

const setup = () => {
  const storage = new FakeFileStorage();
  return { storage, options: { fetchImpl: fakeRangeFetch(storage) } };
};
const keyFor = (name = 'a.pdf', version = 1) => documentKey({ documentId: DOCUMENT_ID, version, originalName: name });

describe('createUploadTicket', () => {
  it('signs a PUT for a key made from the document id and version, with the content type and length', async () => {
    const { storage } = setup();
    const { key, put } = await createUploadTicket(storage, {
      documentId: DOCUMENT_ID,
      version: 2,
      originalName: 'Battle card.pdf',
      mime: 'application/pdf',
      size: 5000,
    });
    expect(parseDocumentKey(key)).toEqual({ documentId: DOCUMENT_ID, version: 2 });
    expect(put.headers).toEqual({ 'Content-Type': 'application/pdf' });
    expect(storage.presigned).toEqual([expect.objectContaining({ kind: 'put', key })]);
  });

  it('refuses a disallowed type or size before signing anything', async () => {
    const { storage } = setup();
    await expect(
      createUploadTicket(storage, { documentId: DOCUMENT_ID, version: 1, originalName: 'a.exe', mime: 'application/x-msdownload', size: 10 }),
    ).rejects.toMatchObject({ reason: 'file_type_not_allowed' });
    await expect(
      createUploadTicket(storage, { documentId: DOCUMENT_ID, version: 1, originalName: 'a.pdf', mime: 'application/pdf', size: DOCUMENT_MAX_BYTES + 1 }),
    ).rejects.toMatchObject({ reason: 'file_too_large' });
    expect(storage.presigned).toHaveLength(0);
  });
});

describe('verifyUpload', () => {
  it('accepts a finished PDF upload and returns the stored size with a cleaned name', async () => {
    const { storage, options } = setup();
    const key = keyFor();
    storage.simulateUpload(key, 1000, 'application/pdf', PDF_HEAD);
    const file = await verifyUpload(storage, { key, size: 1000, mime: 'application/pdf', originalName: 'C:\\x\\Plan.pdf' }, options);
    expect(file).toEqual({ key, size: 1000, mime: 'application/pdf', originalName: 'Plan.pdf' });
    expect(storage.presigned.filter((p) => p.kind === 'get')).toHaveLength(1);
  });

  it.each([
    ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ZIP_HEAD],
    ['zip', 'application/zip', ZIP_HEAD],
    ['mp4', 'video/mp4', MP4_HEAD],
  ])('accepts a %s whose first bytes match', async (ext, mime, head) => {
    const { storage, options } = setup();
    const key = keyFor(`file.${ext}`);
    storage.simulateUpload(key, 500, mime, head);
    await expect(verifyUpload(storage, { key, size: 500, mime, originalName: `file.${ext}` }, options)).resolves.toMatchObject({ key });
  });

  it('refuses a key that was not made by documentKey', async () => {
    const { storage, options } = setup();
    storage.simulateUpload('seed/a.pdf', 10, 'application/pdf', PDF_HEAD);
    await expect(verifyUpload(storage, { key: 'seed/a.pdf', size: 10, mime: 'application/pdf', originalName: 'a.pdf' }, options)).rejects.toBeInstanceOf(ValidationError);
  });

  it('says file_missing when nothing was uploaded or the size differs', async () => {
    const { storage, options } = setup();
    const key = keyFor();
    await expect(verifyUpload(storage, { key, size: 1000, mime: 'application/pdf', originalName: 'a.pdf' }, options)).rejects.toMatchObject({ reason: 'file_missing' });
    storage.simulateUpload(key, 999, 'application/pdf', PDF_HEAD);
    await expect(verifyUpload(storage, { key, size: 1000, mime: 'application/pdf', originalName: 'a.pdf' }, options)).rejects.toMatchObject({ reason: 'file_missing' });
  });

  it('refuses a stored content type that differs from the declared one', async () => {
    const { storage, options } = setup();
    const key = keyFor();
    storage.simulateUpload(key, 1000, 'application/octet-stream', PDF_HEAD);
    await expect(verifyUpload(storage, { key, size: 1000, mime: 'application/pdf', originalName: 'a.pdf' }, options)).rejects.toMatchObject({ reason: 'file_type_not_allowed' });
  });

  it('refuses a file whose first bytes do not match its extension, and never deletes the object', async () => {
    const { storage, options } = setup();
    const key = keyFor();
    storage.simulateUpload(key, 1000, 'application/pdf', [0x4d, 0x5a, 0x90, 0x00]);
    const error = await verifyUpload(storage, { key, size: 1000, mime: 'application/pdf', originalName: 'a.pdf' }, options).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictError);
    expect((error as ConflictError).reason).toBe('file_type_not_allowed');
    expect(storage.deleted).toEqual([]);
  });

  it('reports an R2 problem as IntegrationError when the range read fails', async () => {
    const { storage } = setup();
    const key = keyFor();
    storage.simulateUpload(key, 1000, 'application/pdf', PDF_HEAD);
    const failing: typeof fetch = async () => new Response('nope', { status: 403 });
    await expect(verifyUpload(storage, { key, size: 1000, mime: 'application/pdf', originalName: 'a.pdf' }, { fetchImpl: failing })).rejects.toBeInstanceOf(IntegrationError);
  });

  it('reads only the first bytes even when the server ignores the Range header', async () => {
    const { storage } = setup();
    const key = keyFor();
    storage.simulateUpload(key, 1000, 'application/pdf', PDF_HEAD);
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(PDF_HEAD));
      },
      cancel() {
        cancelled = true;
      },
    });
    const wholeFile: typeof fetch = async () => new Response(stream, { status: 200 });
    await expect(verifyUpload(storage, { key, size: 1000, mime: 'application/pdf', originalName: 'a.pdf' }, { fetchImpl: wholeFile })).resolves.toMatchObject({ key });
    expect(cancelled).toBe(true);
  });
});

describe('matchesMagic', () => {
  it('knows the signatures of the six allowed types and nothing else', () => {
    expect(matchesMagic('pdf', PDF_HEAD)).toBe(true);
    expect(matchesMagic('pdf', ZIP_HEAD)).toBe(false);
    for (const ext of ['pptx', 'docx', 'xlsx', 'zip']) expect(matchesMagic(ext, ZIP_HEAD)).toBe(true);
    expect(matchesMagic('mp4', MP4_HEAD)).toBe(true);
    expect(matchesMagic('mp4', PDF_HEAD)).toBe(false);
    expect(matchesMagic('exe', [0x4d, 0x5a])).toBe(false);
    expect(matchesMagic('pdf', [])).toBe(false);
  });
});
