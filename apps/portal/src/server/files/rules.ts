import { type AudienceKind, PARTNER_CATEGORY_PLURAL, type PartnerCategory } from '@/lib/domain';
import { ConflictError } from '@/server/errors';

export const DOCUMENT_MAX_BYTES = 100 * 1024 * 1024;
/** A replaced file stays in R2 and in document_versions this long (master plan 3.2). */
export const OLD_KEY_RETENTION_DAYS = 30;
/** A soft deleted document is purged (tombstoned) after this long. */
export const DELETED_DOCUMENT_RETENTION_DAYS = 30;
/** documents.file_key of a purged document: 'purged/<document id>'. */
export const PURGED_KEY_PREFIX = 'purged/';

/** Allow list. Extension, mime and the label shown in the library ("PDF"). */
export const ALLOWED_DOCUMENT_TYPES: ReadonlyArray<{ ext: string; mime: string; label: string }> = [
  { ext: 'pdf', mime: 'application/pdf', label: 'PDF' },
  { ext: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', label: 'PPTX' },
  { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'DOCX' },
  { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'XLSX' },
  { ext: 'mp4', mime: 'video/mp4', label: 'MP4' },
  { ext: 'zip', mime: 'application/zip', label: 'ZIP' },
];

/** Value for the `accept` attribute of the file inputs. */
export const UPLOAD_ACCEPT = ALLOWED_DOCUMENT_TYPES.map((type) => `.${type.ext}`).join(',');

export interface AudienceView {
  kind: AudienceKind;
  categories: readonly PartnerCategory[];
  partnerIds: readonly string[];
}

/** Moved from the mock's canPartnerOpen. Must agree with the documents_select policy in rls.sql; documents.test.ts checks both on the same cases. */
export function canPartnerOpen(audience: AudienceView, partner: { id: string; category: PartnerCategory }): boolean {
  switch (audience.kind) {
    case 'all':
      return true;
    case 'categories':
      return audience.categories.includes(partner.category);
    case 'named':
      return audience.partnerIds.includes(partner.id);
  }
}

/** The Audience column and badge text. Mock wording: "All partners", "Distributors, channel", "2 partners", "No one yet". */
export function audienceLabel(audience: {
  kind: AudienceKind;
  categories: readonly PartnerCategory[];
  partners: readonly unknown[];
}): string {
  switch (audience.kind) {
    case 'all':
      return 'All partners';
    case 'categories':
      if (audience.categories.length === 0) return 'No one yet';
      return audience.categories
        .map((category, index) => {
          const plural = PARTNER_CATEGORY_PLURAL[category];
          const word = plural.split(' ')[0] ?? plural;
          return index === 0 ? word : word.toLowerCase();
        })
        .join(', ');
    case 'named':
      return `${audience.partners.length} ${audience.partners.length === 1 ? 'partner' : 'partners'}`;
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes >= 10 ? Math.round(megabytes) : (Math.round(megabytes * 10) / 10).toFixed(1)} MB`;
};

/** "PDF, 1.1 MB" or "MP4, 14 min" for videos with a duration. */
export function formatLabel(input: { mime: string; fileSize: number; durationMinutes: number | null }): string {
  const known = ALLOWED_DOCUMENT_TYPES.find((type) => type.mime === input.mime);
  const label = known?.label ?? (input.mime.split('/')[1] ?? 'file').toUpperCase();
  if (input.mime === 'video/mp4' && input.durationMinutes !== null) return `${label}, ${input.durationMinutes} min`;
  return `${label}, ${formatBytes(input.fileSize)}`;
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const KEY_RE = new RegExp(`^documents/(${UUID})/v([1-9][0-9]{0,3})/${UUID}-[A-Za-z0-9-]{1,60}(?:\\.[a-z0-9]{1,8})?$`);

const baseName = (name: string): string => name.split(/[\\/]/).pop() ?? '';

/** Lower case extension without the dot, or '' when there is none. */
export function extensionOf(name: string): string {
  const base = baseName(name);
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : '';
}

/** The content type for an allow listed extension, or null. The server decides the type; the browser's File.type is never trusted. */
export function mimeForFileName(name: string): string | null {
  const ext = extensionOf(name);
  return ALLOWED_DOCUMENT_TYPES.find((type) => type.ext === ext)?.mime ?? null;
}

/** The name stored in documents.original_name and shown to people: no path, no control characters, at most 200 characters, extension kept. */
export function cleanOriginalName(name: string): string {
  const visible = Array.from(baseName(name).normalize('NFC'))
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code >= 0x20 && code !== 0x7f;
    })
    .join('')
    .trim();
  if (visible === '') return 'file';
  if (visible.length <= 200) return visible;
  const ext = extensionOf(visible);
  const suffix = ext === '' ? '' : `.${ext}`;
  return `${visible.slice(0, visible.length - suffix.length).slice(0, 200 - suffix.length)}${suffix}`;
}

/** The only part of a user's file name that reaches an R2 key: letters, digits and hyphens in the stem, a short lower case extension. */
export function sanitiseFileName(name: string): string {
  const base = baseName(name);
  const dot = base.lastIndexOf('.');
  const ext = dot > 0 ? base.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) : '';
  const stem = (dot > 0 ? base.slice(0, dot) : base)
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${stem || 'file'}${ext ? `.${ext}` : ''}`;
}

/** Key scheme: documents/<documentId>/v<version>/<uuid>-<sanitised filename>. Never user controlled beyond the sanitised name. */
export function documentKey(input: { documentId: string; version: number; originalName: string }): string {
  return `documents/${input.documentId}/v${input.version}/${crypto.randomUUID()}-${sanitiseFileName(input.originalName)}`;
}

/** The document id and version inside a key made by documentKey, or null for any other string. */
export function parseDocumentKey(key: string): { documentId: string; version: number } | null {
  const match = KEY_RE.exec(key);
  if (!match) return null;
  const [, documentId, version] = match;
  if (documentId === undefined || version === undefined) return null;
  return { documentId, version: Number(version) };
}

/** Throws ConflictError('file_too_large') or ConflictError('file_type_not_allowed'); an empty file is ConflictError('file_missing'). */
export function assertUploadAllowed(input: { size: number; mime: string; originalName: string }): void {
  if (input.size <= 0) throw new ConflictError('file_missing', 'That file is empty.');
  if (input.size > DOCUMENT_MAX_BYTES) throw new ConflictError('file_too_large', 'Files can be up to 100 MB.');
  const ext = extensionOf(input.originalName);
  const allowed = ALLOWED_DOCUMENT_TYPES.find((type) => type.ext === ext);
  if (!allowed || allowed.mime !== input.mime.toLowerCase()) {
    throw new ConflictError('file_type_not_allowed', 'Upload a PDF, PPTX, DOCX, XLSX, MP4 or ZIP file.');
  }
}
