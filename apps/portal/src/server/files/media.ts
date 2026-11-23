import { ConflictError, ValidationError } from '@/server/errors';
import { extensionOf } from './rules';
import type { FileStorage, PresignedPut } from './storage';
import { PEEK_BYTES, rangeRead } from './upload';

/** The optional extras of a video document: a poster image and a captions file. */
export const MEDIA_KINDS = ['poster', 'captions'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const POSTER_MAX_BYTES = 2 * 1024 * 1024;
export const CAPTIONS_MAX_BYTES = 500 * 1024;

export const MEDIA_MAX_BYTES: Record<MediaKind, number> = { poster: POSTER_MAX_BYTES, captions: CAPTIONS_MAX_BYTES };
export const MEDIA_ACCEPT: Record<MediaKind, string> = { poster: '.png,.jpg,.jpeg', captions: '.vtt' };
export const MEDIA_TYPE_MESSAGE: Record<MediaKind, string> = {
  poster: 'Upload a PNG or JPG image, up to 2 MB.',
  captions: 'Upload a WebVTT captions file (.vtt), up to 500 KB.',
};
export const MEDIA_LABEL: Record<MediaKind, string> = { poster: 'poster image', captions: 'captions file' };

const POSTER_TYPES: Record<string, { mime: string; ext: string }> = {
  png: { mime: 'image/png', ext: 'png' },
  jpg: { mime: 'image/jpeg', ext: 'jpg' },
  jpeg: { mime: 'image/jpeg', ext: 'jpg' },
};

const KEY_RE = /^documents\/([0-9a-f-]{36})\/media\/[0-9a-f-]{36}-(poster|captions)\.(png|jpg|vtt)$/;

/** The content type the server decides for a file name and kind, or null. The browser's File.type is never trusted. */
export function mediaMimeFor(kind: MediaKind, originalName: string): string | null {
  const ext = extensionOf(originalName);
  if (kind === 'captions') return ext === 'vtt' ? 'text/vtt' : null;
  return POSTER_TYPES[ext]?.mime ?? null;
}

const storedExt = (kind: MediaKind, originalName: string): string => (kind === 'captions' ? 'vtt' : (POSTER_TYPES[extensionOf(originalName)]?.ext ?? 'png'));

/** documents/<document id>/media/<uuid>-<kind>.<ext>. The document id in the key lets the confirm step refuse a key made for another document. */
export const mediaKey = (input: { documentId: string; kind: MediaKind; originalName: string }): string =>
  `documents/${input.documentId}/media/${crypto.randomUUID()}-${input.kind}.${storedExt(input.kind, input.originalName)}`;

export function parseMediaKey(key: string): { documentId: string; kind: MediaKind } | null {
  const match = KEY_RE.exec(key);
  const [, documentId, kind] = match ?? [];
  return documentId && (kind === 'poster' || kind === 'captions') ? { documentId, kind } : null;
}

/** The content type for a stored poster key, for the response header. */
export const posterMimeOfKey = (key: string): string => (key.endsWith('.png') ? 'image/png' : 'image/jpeg');

/** ConflictError('file_missing' | 'file_too_large' | 'file_type_not_allowed'). Returns the content type. */
export function assertMediaAllowed(input: { kind: MediaKind; size: number; originalName: string }): string {
  const mime = mediaMimeFor(input.kind, input.originalName);
  if (!mime) throw new ConflictError('file_type_not_allowed', MEDIA_TYPE_MESSAGE[input.kind]);
  if (input.size <= 0) throw new ConflictError('file_missing', 'That file is empty.');
  if (input.size > MEDIA_MAX_BYTES[input.kind]) {
    throw new ConflictError('file_too_large', input.kind === 'poster' ? 'The poster image can be up to 2 MB.' : 'The captions file can be up to 500 KB.');
  }
  return mime;
}

const startsWith = (bytes: readonly number[], signature: readonly number[]): boolean => signature.every((byte, index) => bytes[index] === byte);
const WEBVTT = [0x57, 0x45, 0x42, 0x56, 0x54, 0x54];
const BOM = [0xef, 0xbb, 0xbf];
const AFTER_SIGNATURE = new Set([0x20, 0x09, 0x0a, 0x0d]);

/** PNG `\x89PNG\r\n\x1a\n`, JPEG `FF D8 FF`, or a WebVTT file: optional UTF-8 BOM, then `WEBVTT` followed by a space, tab, line break or the end. */
export function matchesMediaMagic(kind: MediaKind, bytes: readonly number[]): boolean {
  if (kind === 'poster') {
    return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) || startsWith(bytes, [0xff, 0xd8, 0xff]);
  }
  const body = startsWith(bytes, BOM) ? bytes.slice(BOM.length) : bytes;
  if (!startsWith(body, WEBVTT)) return false;
  const next = body[WEBVTT.length];
  return next === undefined || AFTER_SIGNATURE.has(next);
}

export async function createMediaTicket(
  storage: FileStorage,
  input: { documentId: string; kind: MediaKind; originalName: string; size: number },
): Promise<{ key: string; put: PresignedPut }> {
  const mime = assertMediaAllowed(input);
  const key = mediaKey(input);
  return { key, put: await storage.presignPut({ key, contentType: mime, contentLength: input.size }) };
}

/** Step 2: the object exists with the signed size and type, belongs to this document and kind, and starts with the right bytes. Never deletes the object. */
export async function verifyMedia(
  storage: FileStorage,
  input: { documentId: string; kind: MediaKind; key: string; size: number; originalName: string },
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const parsed = parseMediaKey(input.key);
  if (parsed?.documentId !== input.documentId || parsed.kind !== input.kind) {
    throw new ValidationError([{ path: input.kind, message: 'This upload cannot be used. Choose the file again.' }]);
  }
  const mime = assertMediaAllowed(input);
  const stored = await storage.head(input.key);
  if (!stored || stored.size !== input.size) throw new ConflictError('file_missing', `The ${MEDIA_LABEL[input.kind]} did not finish uploading. Try again.`);
  if (stored.contentType.split(';')[0]?.trim().toLowerCase() !== mime) throw new ConflictError('file_type_not_allowed', MEDIA_TYPE_MESSAGE[input.kind]);
  const prefix = storage.peek ? await storage.peek(input.key, PEEK_BYTES) : await rangeRead(storage, { key: input.key, originalName: input.originalName }, fetchImpl);
  if (!matchesMediaMagic(input.kind, prefix)) {
    throw new ConflictError('file_type_not_allowed', input.kind === 'poster' ? 'That file is not a valid PNG or JPG image.' : 'That file is not WebVTT. It must start with WEBVTT.');
  }
  return input.key;
}
