import { chatExtension, chatMimeFor, CHAT_FILE_MAX_BYTES, CHAT_FILE_TYPES, formatBytes } from '@/lib/chat';
import { ConflictError, ValidationError } from '@/server/errors';
import { sanitiseFileName } from './rules';
import type { FileStorage } from './storage';
import { PEEK_BYTES, rangeRead } from './upload';

/** Chat files live under their own prefix of the portal bucket, next to (never inside) documents/ and partner-logos/. */
export const CHAT_KEY_PREFIX = 'chat/';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const KEY_RE = new RegExp(`^chat/(${UUID})/${UUID}-[A-Za-z0-9-]{1,60}(?:\\.[a-z0-9]{1,8})?$`);

/** chat/<conversation id>/<uuid>-<sanitised name>. The only user controlled part is the sanitised name. */
export const chatFileKey = (input: { conversationId: string; name: string }): string =>
  `${CHAT_KEY_PREFIX}${input.conversationId}/${crypto.randomUUID()}-${sanitiseFileName(input.name)}`;

export const parseChatKey = (key: string): { conversationId: string } | null => {
  const match = KEY_RE.exec(key);
  return match?.[1] ? { conversationId: match[1] } : null;
};

const starts = (bytes: readonly number[], signature: readonly number[], offset = 0): boolean => signature.every((byte, i) => bytes[offset + i] === byte);

/**
 * First bytes against what the extension claims, for the types that have a dependable signature. Plain text, CSV, JSON, MOV and
 * audio have none worth trusting, so they are accepted by extension, stored as downloads and never rendered inline.
 */
export function chatMagicOk(ext: string, bytes: readonly number[]): boolean {
  switch (ext) {
    case 'png':
      return starts(bytes, [0x89, 0x50, 0x4e, 0x47]);
    case 'jpg':
    case 'jpeg':
      return starts(bytes, [0xff, 0xd8, 0xff]);
    case 'gif':
      return starts(bytes, [0x47, 0x49, 0x46, 0x38]);
    case 'webp':
      return starts(bytes, [0x52, 0x49, 0x46, 0x46]) && starts(bytes, [0x57, 0x45, 0x42, 0x50], 8);
    case 'pdf':
      return starts(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    case 'docx':
    case 'xlsx':
    case 'pptx':
    case 'zip':
      return starts(bytes, [0x50, 0x4b, 0x03, 0x04]);
    case 'mp4':
      return starts(bytes, [0x66, 0x74, 0x79, 0x70], 4);
    default:
      return CHAT_FILE_TYPES.some((type) => type.ext === ext);
  }
}

/** Throws a ValidationError for a name, size or type the chat does not accept; returns the content type the server chose. */
export function assertChatFileAllowed(input: { name: string; size: number }): string {
  const mime = chatMimeFor(input.name);
  if (input.size <= 0) throw new ValidationError([{ path: 'file', message: 'That file is empty.' }]);
  if (input.size > CHAT_FILE_MAX_BYTES) throw new ValidationError([{ path: 'file', message: `Files can be up to ${formatBytes(CHAT_FILE_MAX_BYTES)}.` }]);
  if (mime === null) throw new ValidationError([{ path: 'file', message: 'That file type is not supported in chat.' }]);
  return mime;
}

/**
 * Before a message carries a file: it is in storage, the size is what was signed, the stored type is the one we chose and the
 * first bytes match the extension. A file that fails is deleted by the caller (it belongs to nobody yet).
 */
export async function verifyChatUpload(
  storage: FileStorage,
  input: { key: string; size: number; mime: string; name: string },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const stored = await storage.head(input.key);
  if (!stored || stored.size !== input.size) throw new ConflictError('file_missing', `${input.name} did not finish uploading. Attach it again.`);
  if (stored.contentType.split(';')[0]?.trim().toLowerCase() !== input.mime.toLowerCase()) {
    throw new ConflictError('file_type_not_allowed', `${input.name} is not the type it claims to be.`);
  }
  const ext = chatExtension(input.name);
  const prefix = storage.peek ? await storage.peek(input.key, PEEK_BYTES) : await rangeRead(storage, { key: input.key, originalName: input.name }, fetchImpl);
  if (!chatMagicOk(ext, prefix)) throw new ConflictError('file_type_not_allowed', `${input.name} is not a valid ${ext.toUpperCase()}.`);
}
