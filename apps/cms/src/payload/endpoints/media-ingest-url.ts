import type { Endpoint } from 'payload';
import { z } from 'zod';

import { hasAnyRole } from '../access/typed-user';
import { ALLOWED_MIME_TYPES, checkUploadSize } from '../lib/upload-limits';
import { followWithSsrfGuard } from '../lib/url-safety/follow-with-ssrf-guard';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const ALLOWED_IMAGE_MIMES: ReadonlySet<string> = new Set(
  ALLOWED_MIME_TYPES.filter((m) => m.startsWith('image/')),
);

const FETCH_TIMEOUT_MS = 15_000;
const MAX_BYTES = 25 * 1024 * 1024;

const Body = z.object({
  url: z.string().url(),
  folder: z.string().optional(),
  alt: z.string().optional(),
});

const inferredFilename = (url: URL, mimetype: string): string => {
  const last = url.pathname.split('/').filter(Boolean).pop() ?? '';
  const cleaned = last.split('?')[0]?.split('#')[0] ?? '';
  if (cleaned && /\.[a-zA-Z0-9]+$/.test(cleaned)) return cleaned;
  const ext = mimetype.split('/')[1]?.split('+')[0] ?? 'bin';
  const base = cleaned || `ingested-${Date.now()}`;
  return `${base}.${ext}`;
};

interface MediaDoc {
  id: number | string;
  url?: string | null;
  alt?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
}

// Preserve the native id type Payload returned. On the Postgres adapter
// this is a number; on Mongo it is a 24-char ObjectID string. Coercing
// to string here would corrupt the upload-node `value` and trip
// Payload's relationship/upload validator on save, since the stock
// `isValidID` requires `typeof value === 'number'` for numeric adapters.
const preserveId = (id: number | string): number | string => {
  if (typeof id === 'number') return id;
  // Postgres adapter sometimes returns a numeric string from the SDK
  // depending on the call shape — coerce only when it's an integer
  // literal so we don't accidentally Number() a Mongo ObjectID.
  if (typeof id === 'string' && /^[0-9]+$/.test(id)) return Number.parseInt(id, 10);
  return id;
};

/**
 * POST /api/media-ingest-url
 *
 * Server-side ingestion of an external image URL into the Media
 * collection. Used by:
 *   - `RichPastePlugin` when a pasted blog brings inline <img> tags
 *     pointing at a third-party CDN (Webflow, etc.). The browser
 *     cannot CORS-fetch those URLs, so the work has to happen here.
 *   - The "From URL" tab of the InlineImage insert dialog, for the
 *     same reason.
 *
 * Auth: admin / editor / author. SSRF: rejects loopback, RFC1918,
 * link-local, and cloud-metadata hosts. Body cap: 25 MB.
 */
export const mediaIngestUrlEndpoint: Endpoint = {
  path: '/media-ingest-url',
  method: 'post',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor', 'author'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = typeof req.json === 'function' ? await req.json() : undefined;
    } catch {
      return json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }
    const parsed = Body.safeParse(body);
    if (!parsed.success) {
      return json(
        { ok: false, error: 'invalid_body', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    let target: URL;
    try {
      target = new URL(parsed.data.url);
    } catch {
      return json({ ok: false, error: 'invalid_url' }, { status: 400 });
    }
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return json({ ok: false, error: 'unsupported_protocol' }, { status: 400 });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let followed: Awaited<ReturnType<typeof followWithSsrfGuard>>;
    try {
      followed = await followWithSsrfGuard(target.toString(), {
        signal: controller.signal,
        headers: { Accept: 'image/*' },
      });
    } catch (err) {
      clearTimeout(timer);
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      return json(
        { ok: false, error: aborted ? 'fetch_timeout' : 'fetch_failed' },
        { status: 502 },
      );
    }
    clearTimeout(timer);

    if (!followed.ok) {
      if (followed.kind === 'unsafe-url' || followed.kind === 'invalid-url') {
        return json({ ok: false, error: 'host_not_allowed' }, { status: 400 });
      }
      return json({ ok: false, error: 'fetch_failed' }, { status: 502 });
    }

    const response = followed.response;
    if (!response.ok) {
      return json(
        { ok: false, error: 'fetch_failed', status: response.status },
        { status: 502 },
      );
    }

    const contentLengthHeader = response.headers.get('content-length');
    if (contentLengthHeader) {
      const declared = Number.parseInt(contentLengthHeader, 10);
      if (Number.isFinite(declared) && declared > MAX_BYTES) {
        return json(
          { ok: false, error: 'payload_too_large', limit: MAX_BYTES },
          { status: 413 },
        );
      }
    }

    const headerMime = (response.headers.get('content-type') ?? '')
      .split(';')[0]
      ?.trim()
      .toLowerCase() ?? '';

    let buffer: ArrayBuffer;
    try {
      buffer = await response.arrayBuffer();
    } catch {
      return json({ ok: false, error: 'fetch_failed' }, { status: 502 });
    }
    if (buffer.byteLength > MAX_BYTES) {
      return json(
        { ok: false, error: 'payload_too_large', limit: MAX_BYTES },
        { status: 413 },
      );
    }

    const mimetype = ALLOWED_IMAGE_MIMES.has(headerMime) ? headerMime : '';
    if (!mimetype) {
      return json(
        { ok: false, error: 'unsupported_mime', received: headerMime || 'unknown' },
        { status: 415 },
      );
    }

    const sizeCheck = checkUploadSize(mimetype, buffer.byteLength);
    if (!sizeCheck.ok) {
      return json({ ok: false, error: 'payload_too_large', reason: sizeCheck.reason }, { status: 413 });
    }

    const name = inferredFilename(target, mimetype);
    const data: Buffer = Buffer.from(buffer);

    const docData: Record<string, unknown> = {};
    if (parsed.data.folder) docData.folder = parsed.data.folder;
    if (parsed.data.alt) docData.alt = parsed.data.alt;

    try {
      const doc = (await req.payload.create({
        collection: 'media',
        data: docData,
        file: { data, mimetype, name, size: buffer.byteLength },
        user: req.user ?? undefined,
      })) as MediaDoc;
      return json({
        ok: true,
        doc: {
          id: preserveId(doc.id),
          url: doc.url ?? null,
          alt: doc.alt ?? null,
          filename: doc.filename ?? null,
          mimeType: doc.mimeType ?? null,
          width: doc.width ?? null,
          height: doc.height ?? null,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'create_failed';
      return json({ ok: false, error: 'create_failed', detail: message }, { status: 500 });
    }
  },
};
