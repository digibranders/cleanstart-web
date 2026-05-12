/**
 * Shared media-upload helper for the inline-image surfaces (paste,
 * drop, slash-menu insert dialog). Posts a single file directly to
 * `/api/media` so the Media collection's `beforeValidate` (SVG
 * sanitisation, size guard) and `beforeChange` (alt auto-fill) hooks
 * still run.
 *
 * The hero `MediaField` keeps its own inline XHR-based uploader so
 * progress can be wired to its progress bar; this helper is the
 * simpler `fetch` variant for surfaces that don't expose progress UI.
 */

export type UploadedMediaDoc = {
  id: string;
  filename?: string | null | undefined;
  mimeType?: string | null | undefined;
  url?: string | null | undefined;
  alt?: string | null | undefined;
  width?: number | null | undefined;
  height?: number | null | undefined;
};

export type UploadMediaFileResult =
  | { ok: true; doc: UploadedMediaDoc }
  | { ok: false; error: string };

const ALLOWED_MIMES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'image/gif',
]);

const IMAGE_BYTES_LIMIT = 25 * 1024 * 1024;

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const validate = (file: File): string | null => {
  if (!ALLOWED_MIMES.has(file.type)) {
    return `Unsupported file type${file.type ? ` (${file.type})` : ''}.`;
  }
  if (file.size > IMAGE_BYTES_LIMIT) {
    return `File too large (${formatBytes(file.size)} > ${formatBytes(IMAGE_BYTES_LIMIT)}).`;
  }
  return null;
};

const namedClipboardFile = (file: File): File => {
  if (file.name && file.name !== 'image.png') return file;
  const ext = file.type.split('/')[1] ?? 'png';
  return new File([file], `pasted-${Date.now()}.${ext}`, { type: file.type });
};

export const uploadMediaFile = async (
  rawFile: File,
  options: { folder: string; alt?: string },
): Promise<UploadMediaFileResult> => {
  const file = namedClipboardFile(rawFile);
  const validationError = validate(file);
  if (validationError) return { ok: false, error: validationError };

  const payload: Record<string, unknown> = { folder: options.folder };
  if (options.alt) payload.alt = options.alt;

  const fd = new FormData();
  fd.append('file', file, file.name);
  fd.append('_payload', JSON.stringify(payload));

  try {
    const res = await fetch('/api/media', {
      method: 'POST',
      body: fd,
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    const text = await res.text();
    if (!res.ok) {
      let message = `Upload failed (${res.status}).`;
      try {
        const body = JSON.parse(text) as { errors?: { message?: string }[]; message?: string };
        if (body?.errors?.[0]?.message) message = body.errors[0].message ?? message;
        else if (body?.message) message = body.message;
      } catch {
        // ignore parse error; default message stands
      }
      return { ok: false, error: message };
    }
    const json = JSON.parse(text) as { doc?: UploadedMediaDoc } | UploadedMediaDoc;
    const doc: UploadedMediaDoc | undefined =
      'doc' in (json as { doc?: UploadedMediaDoc }) && (json as { doc?: UploadedMediaDoc }).doc
        ? (json as { doc: UploadedMediaDoc }).doc
        : (json as UploadedMediaDoc);
    if (!doc?.id) return { ok: false, error: 'Upload succeeded but the response was malformed.' };
    return { ok: true, doc };
  } catch {
    return { ok: false, error: 'Network error during upload.' };
  }
};

/**
 * Ingest a remote URL into the Media collection. Returns `ok: false`
 * with a sentinel `error` of `'unsupported'` when the collection does
 * not accept URL ingest — callers can surface a friendly message and
 * hide the URL tab.
 */
export const uploadMediaFromUrl = async (
  sourceUrl: string,
  options: { folder: string; alt?: string },
): Promise<UploadMediaFileResult> => {
  if (!/^https?:\/\//i.test(sourceUrl)) {
    return { ok: false, error: 'URL must start with http:// or https://.' };
  }
  try {
    const fetched = await fetch(sourceUrl, { mode: 'cors' });
    if (!fetched.ok) return { ok: false, error: `Could not fetch URL (${fetched.status}).` };
    const blob = await fetched.blob();
    if (!blob.type.startsWith('image/')) {
      return { ok: false, error: 'The URL did not return an image.' };
    }
    const name = (sourceUrl.split('/').pop() ?? 'image').split('?')[0] || `image-${Date.now()}`;
    const file = new File([blob], name, { type: blob.type });
    return uploadMediaFile(file, options);
  } catch {
    return {
      ok: false,
      error: 'Could not load the remote image. CORS may be blocking it — download and upload instead.',
    };
  }
};
