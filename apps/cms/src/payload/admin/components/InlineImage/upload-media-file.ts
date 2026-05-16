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

/**
 * Coerce a Media doc id into the shape Payload's stock validators
 * expect. Postgres uses numeric auto-increment ids; if the id arrives
 * as the numeric string `"18"` (e.g. via a server response that
 * stringified it, or via JSON.parse round-tripping through a
 * `Number → JSON → string` boundary), Payload's `isValidID` rejects
 * it because it checks `typeof value === 'number'` strictly. Mongo
 * ObjectIDs are 24-char hex strings and must stay as strings.
 *
 * Use at every site that constructs an UploadNode's `data.value` to
 * keep the upload-node shape consistent with what the validator and
 * the relationship resolver expect.
 */
export const normalizeUploadValue = (id: number | string): number | string => {
  if (typeof id === 'number') return id;
  if (typeof id === 'string' && /^[0-9]+$/.test(id)) return Number.parseInt(id, 10);
  return id;
};

export type UploadedMediaDoc = {
  // Preserve the native id shape Payload returns: a number on Postgres,
  // a string ObjectID on Mongo. Coercing to string here would corrupt
  // upload-node `value` and fail validation on save (`isValidID`
  // requires `typeof value === 'number'` for numeric adapters).
  id: number | string;
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

const UNSUPPORTED_PROTOCOL_MESSAGE = 'URL must start with http:// or https://.';

const FRIENDLY_INGEST_ERRORS: Record<string, string> = {
  invalid_url: 'That does not look like a valid URL.',
  unsupported_protocol: UNSUPPORTED_PROTOCOL_MESSAGE,
  host_not_allowed: 'That host is not allowed (loopback or private network).',
  fetch_timeout: 'The remote server took too long to respond.',
  fetch_failed: 'Could not download the image from that URL.',
  payload_too_large: 'The remote image is over the 25 MB limit.',
  unsupported_mime: 'The URL did not return a supported image format.',
  create_failed: 'Could not save the image to the media library.',
  forbidden: 'You do not have permission to ingest media URLs.',
};

/**
 * Ingest a remote URL into the Media collection via the server-side
 * `/api/media-ingest-url` endpoint. The server fetches the URL with no
 * CORS boundary, validates mime/size, sanitises SVGs via the Media
 * collection's `beforeValidate` hook, and creates the doc through
 * Payload's normal upload pipeline (sharp resize, webp transcode,
 * R2 storage, alt auto-fill).
 *
 * Replaces the previous browser-side `fetch(url, { mode: 'cors' })`
 * implementation, which silently failed against any third-party CDN
 * that did not set permissive CORS headers (Webflow's CDN does not).
 */
export const ingestMediaFromUrl = async (
  sourceUrl: string,
  options: { folder: string; alt?: string },
): Promise<UploadMediaFileResult> => {
  if (!/^https?:\/\//i.test(sourceUrl)) {
    return { ok: false, error: UNSUPPORTED_PROTOCOL_MESSAGE };
  }
  const body: Record<string, unknown> = { url: sourceUrl, folder: options.folder };
  if (options.alt) body.alt = options.alt;
  try {
    const res = await fetch('/api/media-ingest-url', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let payload: { ok?: boolean; doc?: UploadedMediaDoc; error?: string } = {};
    try {
      payload = JSON.parse(text);
    } catch {
      return { ok: false, error: `Ingest failed (${res.status}).` };
    }
    if (!res.ok || !payload.ok) {
      const code = payload.error ?? 'create_failed';
      const friendly = FRIENDLY_INGEST_ERRORS[code] ?? `Ingest failed (${code}).`;
      return { ok: false, error: friendly };
    }
    if (!payload.doc?.id) {
      return { ok: false, error: 'Ingest succeeded but the response was malformed.' };
    }
    return { ok: true, doc: payload.doc };
  } catch {
    return { ok: false, error: 'Network error during ingest.' };
  }
};

/**
 * @deprecated Use `ingestMediaFromUrl`. Retained as a temporary alias
 * for callers that have not migrated.
 */
export const uploadMediaFromUrl = ingestMediaFromUrl;
