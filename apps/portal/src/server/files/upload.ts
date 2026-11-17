import { ConflictError, IntegrationError, ValidationError } from '@/server/errors';
import type { UploadedFile } from '@/server/repo/documents';
import { assertUploadAllowed, cleanOriginalName, documentKey, extensionOf, parseDocumentKey } from './rules';
import type { FileStorage, PresignedPut } from './storage';

const PEEK_BYTES = 16;
const TYPE_MESSAGE = 'Upload a PDF, PPTX, DOCX, XLSX, MP4 or ZIP file.';

/** Step 1 of an upload: the action validates size and type, then returns a presigned PUT. The browser uploads directly to R2. */
export async function createUploadTicket(
  storage: FileStorage,
  input: { documentId: string; version: number; originalName: string; mime: string; size: number },
): Promise<{ key: string; put: PresignedPut }> {
  assertUploadAllowed({ size: input.size, mime: input.mime, originalName: input.originalName });
  const key = documentKey({ documentId: input.documentId, version: input.version, originalName: input.originalName });
  const put = await storage.presignPut({ key, contentType: input.mime, contentLength: input.size });
  return { key, put };
}

const startsWith = (bytes: readonly number[], signature: readonly number[], offset = 0): boolean =>
  signature.every((byte, index) => bytes[offset + index] === byte);

/** First bytes against the signature of the extension: PDF `%PDF-`, Office and ZIP `PK\x03\x04`, MP4 `ftyp` at byte 4. */
export function matchesMagic(ext: string, bytes: readonly number[]): boolean {
  switch (ext) {
    case 'pdf':
      return startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    case 'pptx':
    case 'docx':
    case 'xlsx':
    case 'zip':
      return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
    case 'mp4':
      return startsWith(bytes, [0x66, 0x74, 0x79, 0x70], 4);
    default:
      return false;
  }
}

/** Reads at most `length` bytes of a response body and cancels the rest, so a server that ignores Range cannot make us download 100 MB. */
async function readPrefix(response: Response, length: number): Promise<number[]> {
  const reader = response.body?.getReader();
  if (!reader) return [];
  const bytes: number[] = [];
  while (bytes.length < length) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const byte of value) bytes.push(byte);
  }
  await reader.cancel().catch(() => undefined);
  return bytes.slice(0, length);
}

/** The first bytes of the stored object through a presigned GET with a Range header. */
async function rangeRead(storage: FileStorage, input: { key: string; originalName: string }, fetchImpl: typeof fetch): Promise<number[]> {
  const { url } = await storage.presignGet({ key: input.key, filename: input.originalName });
  let response: Response;
  try {
    response = await fetchImpl(url, { headers: { Range: `bytes=0-${PEEK_BYTES - 1}` } });
  } catch (cause) {
    throw new IntegrationError('r2', 'could not read the start of the upload', { cause });
  }
  if (!response.ok) {
    throw new IntegrationError('r2', `range read answered ${response.status}`, { status: response.status });
  }
  return readPrefix(response, PEEK_BYTES);
}

export interface VerifyUploadOptions {
  /** Defaults to the global fetch. Tests pass fakeRangeFetch. */
  fetchImpl?: typeof fetch;
}

/**
 * Step 2: the action calls this before createDocument or replaceDocumentFile. Throws ConflictError('file_missing') when
 * head() finds nothing or the size differs, ConflictError('file_type_not_allowed') when the stored content type or the
 * first bytes do not match, ValidationError when the key was not made by documentKey. Never deletes the object (the key
 * could belong to a live document). The returned originalName is the cleaned display name.
 */
export async function verifyUpload(
  storage: FileStorage,
  input: { key: string; size: number; mime: string; originalName: string },
  options: VerifyUploadOptions = {},
): Promise<UploadedFile> {
  if (parseDocumentKey(input.key) === null) {
    throw new ValidationError([{ path: 'file', message: 'This upload cannot be used. Choose the file again.' }]);
  }
  assertUploadAllowed({ size: input.size, mime: input.mime, originalName: input.originalName });

  const stored = await storage.head(input.key);
  if (!stored || stored.size !== input.size) {
    throw new ConflictError('file_missing', 'The file did not finish uploading. Try again.');
  }
  if (stored.contentType.split(';')[0]?.trim().toLowerCase() !== input.mime.toLowerCase()) {
    throw new ConflictError('file_type_not_allowed', TYPE_MESSAGE);
  }

  const ext = extensionOf(input.originalName);
  const prefix = storage.peek ? await storage.peek(input.key, PEEK_BYTES) : await rangeRead(storage, input, options.fetchImpl ?? fetch);
  if (!matchesMagic(ext, prefix)) {
    throw new ConflictError('file_type_not_allowed', `That file is not a valid ${ext.toUpperCase()}.`);
  }
  return { key: input.key, size: stored.size, mime: input.mime, originalName: cleanOriginalName(input.originalName) };
}
