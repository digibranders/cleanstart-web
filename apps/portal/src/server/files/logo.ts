import { LOGO_MAX_BYTES, LOGO_TYPE_MESSAGE, LOGO_TYPES } from '@/lib/company-profile';
import { ConflictError, ValidationError } from '@/server/errors';
import { extensionOf } from './rules';
import type { FileStorage, PresignedPut } from './storage';
import { PEEK_BYTES, rangeRead } from './upload';

const LOGO_KEY_RE = /^partner-logos\/([0-9a-f-]{36})\/[0-9a-f-]{36}\.(png|jpg|jpeg)$/;

export const logoMimeFor = (name: string): string | null => LOGO_TYPES.find((type) => type.ext === extensionOf(name))?.mime ?? null;

/** partner-logos/<partner id>/<random>.<ext>: the partner id in the key lets the confirm step refuse a key made for another company. */
export const logoKey = (input: { partnerId: string; originalName: string }): string =>
  `partner-logos/${input.partnerId}/${crypto.randomUUID()}.${extensionOf(input.originalName)}`;

export const parseLogoKey = (key: string): { partnerId: string } | null => {
  const match = LOGO_KEY_RE.exec(key);
  return match?.[1] ? { partnerId: match[1] } : null;
};

/** ConflictError('file_missing' | 'file_too_large' | 'file_type_not_allowed'). */
export function assertLogoAllowed(input: { size: number; originalName: string }): string {
  const mime = logoMimeFor(input.originalName);
  if (!mime) throw new ConflictError('file_type_not_allowed', LOGO_TYPE_MESSAGE);
  if (input.size <= 0) throw new ConflictError('file_missing', 'That file is empty.');
  if (input.size > LOGO_MAX_BYTES) throw new ConflictError('file_too_large', 'The logo can be up to 1 MB.');
  return mime;
}

const startsWith = (bytes: readonly number[], signature: readonly number[]): boolean => signature.every((byte, index) => bytes[index] === byte);

/** PNG `\x89PNG\r\n\x1a\n`, JPEG `FF D8 FF`. */
export const matchesLogoMagic = (mime: string, bytes: readonly number[]): boolean =>
  mime === 'image/png' ? startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) : startsWith(bytes, [0xff, 0xd8, 0xff]);

export async function createLogoTicket(
  storage: FileStorage,
  input: { partnerId: string; originalName: string; size: number },
): Promise<{ key: string; put: PresignedPut }> {
  const mime = assertLogoAllowed(input);
  const key = logoKey(input);
  return { key, put: await storage.presignPut({ key, contentType: mime, contentLength: input.size }) };
}

/** Step 2: the object exists with the signed size and type and starts with the right bytes. Never deletes the object. */
export async function verifyLogo(
  storage: FileStorage,
  input: { partnerId: string; key: string; size: number; originalName: string },
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  if (parseLogoKey(input.key)?.partnerId !== input.partnerId) {
    throw new ValidationError([{ path: 'logo', message: 'This upload cannot be used. Choose the file again.' }]);
  }
  const mime = assertLogoAllowed(input);
  const stored = await storage.head(input.key);
  if (!stored || stored.size !== input.size) throw new ConflictError('file_missing', 'The logo did not finish uploading. Try again.');
  if (stored.contentType.split(';')[0]?.trim().toLowerCase() !== mime) throw new ConflictError('file_type_not_allowed', LOGO_TYPE_MESSAGE);
  const prefix = storage.peek ? await storage.peek(input.key, PEEK_BYTES) : await rangeRead(storage, { key: input.key, originalName: input.originalName }, fetchImpl);
  if (!matchesLogoMagic(mime, prefix)) throw new ConflictError('file_type_not_allowed', 'That file is not a valid PNG or JPG image.');
  return input.key;
}
