const MB = 1024 * 1024;

const IMAGE_MIME_PREFIX = 'image/';
const PDF_MIME = 'application/pdf';
const VIDEO_MIME = 'video/mp4';
const ZIP_MIMES = new Set(['application/zip', 'application/x-zip-compressed']);
const DOC_MIME = 'application/msword';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const IMAGE_LIMIT = 25 * MB;
const PDF_LIMIT = 50 * MB;
const VIDEO_LIMIT = 200 * MB;
const ZIP_LIMIT = 100 * MB;
export const RESUME_LIMIT = 10 * MB;

const FALLBACK_LIMIT = IMAGE_LIMIT;

export type UploadLimitResult = { ok: true } | { ok: false; reason: string };

export const RESUME_MIME_TYPES = [PDF_MIME, DOC_MIME, DOCX_MIME] as const;

export const limitForMime = (mimeType: string | undefined | null): number => {
  if (!mimeType) return FALLBACK_LIMIT;
  if (mimeType.startsWith(IMAGE_MIME_PREFIX)) return IMAGE_LIMIT;
  if (mimeType === PDF_MIME) return PDF_LIMIT;
  if (mimeType === VIDEO_MIME) return VIDEO_LIMIT;
  if (ZIP_MIMES.has(mimeType)) return ZIP_LIMIT;
  if (mimeType === DOC_MIME || mimeType === DOCX_MIME) return RESUME_LIMIT;
  return FALLBACK_LIMIT;
};

export const checkUploadSize = (
  mimeType: string | undefined | null,
  filesize: number | undefined | null,
): UploadLimitResult => {
  const limit = limitForMime(mimeType);
  if (filesize == null) return { ok: true };
  if (filesize <= limit) return { ok: true };
  const limitMb = Math.round(limit / MB);
  return {
    ok: false,
    reason: `File too large — limit is ${limitMb} MB for this type.`,
  };
};

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'application/zip',
  'application/x-zip-compressed',
] as const;
