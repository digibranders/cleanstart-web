import type { Endpoint } from 'payload';
import { z } from 'zod';

import { hasAnyRole } from '../access/typed-user';
import {
  ALLOWED_TTL_PRESETS,
  signPreviewToken,
  verifyPreviewToken,
} from '../lib/preview/jwt';
import { isPreviewableCollection, previewPathForDoc } from '../lib/preview/paths';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const allowedTtls = new Set<number>(ALLOWED_TTL_PRESETS);

const mintSchema = z.object({
  collection: z.string().min(1),
  docId: z.union([z.string().min(1), z.number()]).transform((v) => String(v)),
  ttlSeconds: z.number().int().positive(),
  label: z.string().max(120).optional(),
});

const verifySchema = z.object({ token: z.string().min(1) });

const revokeSchema = z.object({
  auditId: z.union([z.string().min(1), z.number()]).transform((v) => String(v)),
});

interface PreviewAuditRow {
  id: string | number;
  collection: string;
  docId: string;
  expiresAt: string;
  revokedAt?: string | null;
}

const webBaseUrl = (): string => {
  const raw = process.env.WEB_BASE_URL;
  if (!raw || raw.length === 0) return 'http://localhost:3001';
  return raw.replace(/\/$/, '');
};

/**
 * POST /api/preview/token
 *
 * Body: { collection, docId, ttlSeconds, label? }
 * Auth: any logged-in admin/editor/author.
 *
 * Mints an audit row, signs an HS256 token referencing it, and
 * returns the full shareable URL for clipboard copy.
 */
export const previewTokenMintEndpoint: Endpoint = {
  path: '/preview/token',
  method: 'post',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor', 'author'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }

    const bodyRaw = req.json ? await req.json() : undefined;
    const parsed = mintSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return json({ ok: false, error: 'invalid_body', issues: parsed.error.issues }, { status: 400 });
    }
    const { collection, docId, ttlSeconds, label } = parsed.data;

    if (!isPreviewableCollection(collection)) {
      return json({ ok: false, error: 'collection_not_previewable' }, { status: 400 });
    }
    if (!allowedTtls.has(ttlSeconds)) {
      return json(
        { ok: false, error: 'ttl_not_allowed', allowed: Array.from(allowedTtls) },
        { status: 400 },
      );
    }

    const rawActorId = (req.user as { id?: string | number }).id;
    const actorId = String(rawActorId);
    const actorRel =
      typeof rawActorId === 'number' ? rawActorId : Number.parseInt(actorId, 10);
    if (!Number.isFinite(actorRel)) {
      return json({ ok: false, error: 'invalid_actor' }, { status: 500 });
    }

    // Look up the doc to embed its current slug in the URL. Draft-aware so
    // even unpublished drafts have a slug (slugField is required at create
    // time for all draft-enabled collections).
    let docSlug: string | null = null;
    try {
      const doc = (await req.payload.findByID({
        collection: collection as Parameters<typeof req.payload.findByID>[0]['collection'],
        id: docId,
        overrideAccess: true,
        depth: 0,
        draft: true,
      })) as { slug?: string | null };
      if (typeof doc.slug === 'string' && doc.slug.length > 0) docSlug = doc.slug;
    } catch {
      return json({ ok: false, error: 'doc_not_found' }, { status: 404 });
    }
    if (!docSlug) {
      return json({ ok: false, error: 'doc_has_no_slug' }, { status: 409 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();

    const auditRow = (await req.payload.create({
      collection: 'previewAudit',
      data: {
        collection,
        docId,
        actor: actorRel,
        ttlSeconds,
        expiresAt,
        ...(label ? { label } : {}),
      },
      overrideAccess: true,
    })) as unknown as PreviewAuditRow;

    const { token } = signPreviewToken({
      collection,
      docId,
      actorId,
      auditId: String(auditRow.id),
      ttlSeconds,
      now,
    });

    const url = `${webBaseUrl()}/preview/${encodeURIComponent(collection)}/${encodeURIComponent(docSlug)}?token=${encodeURIComponent(token)}`;

    return json({ ok: true, token, url, auditId: auditRow.id, expiresAt });
  },
};

/**
 * POST /api/preview/verify
 *
 * Body: { token }
 * Auth: none — the token IS the auth. Called by the web app's
 * `/api/preview/share` route. Returns the resolved public path so
 * the caller doesn't need to know the collection-to-route mapping.
 */
export const previewVerifyEndpoint: Endpoint = {
  path: '/preview/verify',
  method: 'post',
  handler: async (req) => {
    const bodyRaw = req.json ? await req.json() : undefined;
    const parsed = verifySchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return json({ ok: false, error: 'invalid_body' }, { status: 400 });
    }

    const verified = verifyPreviewToken(parsed.data.token);
    if (!verified.ok) {
      return json({ ok: false, error: verified.reason }, { status: 401 });
    }

    let auditRow: PreviewAuditRow;
    try {
      auditRow = (await req.payload.findByID({
        collection: 'previewAudit',
        id: verified.payload.auditId,
        overrideAccess: true,
        depth: 0,
      })) as unknown as PreviewAuditRow;
    } catch {
      return json({ ok: false, error: 'audit_row_missing' }, { status: 401 });
    }

    if (auditRow.revokedAt) {
      return json({ ok: false, error: 'revoked' }, { status: 401 });
    }
    if (
      auditRow.collection !== verified.payload.collection ||
      auditRow.docId !== verified.payload.docId
    ) {
      return json({ ok: false, error: 'audit_mismatch' }, { status: 401 });
    }

    let doc: { slug?: string | null; path?: string | null } = {};
    try {
      doc = (await req.payload.findByID({
        collection: verified.payload.collection as Parameters<typeof req.payload.findByID>[0]['collection'],
        id: verified.payload.docId,
        overrideAccess: true,
        depth: 0,
        draft: true,
      })) as { slug?: string | null; path?: string | null };
    } catch {
      return json({ ok: false, error: 'doc_missing' }, { status: 404 });
    }

    const path = previewPathForDoc(verified.payload.collection, doc);
    if (!path) {
      return json({ ok: false, error: 'doc_has_no_slug_yet' }, { status: 409 });
    }

    return json({
      ok: true,
      collection: verified.payload.collection,
      docId: verified.payload.docId,
      path,
    });
  },
};

/**
 * POST /api/preview/revoke
 *
 * Body: { auditId }
 * Auth: admin or editor.
 *
 * Marks the audit row as revoked. Subsequent /verify calls fail
 * with `revoked`. No JWT-side revocation list needed because the
 * verify endpoint always re-reads the row.
 */
export const previewRevokeEndpoint: Endpoint = {
  path: '/preview/revoke',
  method: 'post',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const bodyRaw = req.json ? await req.json() : undefined;
    const parsed = revokeSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return json({ ok: false, error: 'invalid_body' }, { status: 400 });
    }
    try {
      await req.payload.update({
        collection: 'previewAudit',
        id: parsed.data.auditId,
        data: { revokedAt: new Date().toISOString() },
        overrideAccess: true,
      });
    } catch {
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    }
    return json({ ok: true });
  },
};

/**
 * GET /api/preview/redirect?collection=X&docId=Y
 *
 * Powers the doc-header "Preview" button. The button can't async-mint a
 * token client-side because Payload's `admin.preview` URL builder is
 * synchronous — so the URL points here, this endpoint mints a short-lived
 * (24h) token using the editor's admin session, and 302s to the new
 * `/preview/<collection>/<slug>?token=...` shape on the web side.
 *
 * Editors who want a different TTL, a label, or a link to share with a
 * stakeholder use the `Copy preview link` dialog (the existing
 * /api/preview/token endpoint).
 */
const AUTO_TTL_SECONDS = 24 * 60 * 60;

export const previewRedirectEndpoint: Endpoint = {
  path: '/preview/redirect',
  method: 'get',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor', 'author'])) {
      return new Response('Forbidden', { status: 403 });
    }
    const url = new URL(req.url ?? '', 'http://placeholder');
    const collection = url.searchParams.get('collection') ?? '';
    const docId = url.searchParams.get('docId') ?? '';
    if (collection.length === 0 || docId.length === 0) {
      return new Response('Missing collection or docId', { status: 400 });
    }
    if (!isPreviewableCollection(collection)) {
      return new Response(`Collection "${collection}" is not previewable`, { status: 400 });
    }

    let docSlug: string | null = null;
    try {
      const doc = (await req.payload.findByID({
        collection: collection as Parameters<typeof req.payload.findByID>[0]['collection'],
        id: docId,
        overrideAccess: true,
        depth: 0,
        draft: true,
      })) as { slug?: string | null };
      if (typeof doc.slug === 'string' && doc.slug.length > 0) docSlug = doc.slug;
    } catch {
      return new Response('Doc not found', { status: 404 });
    }
    if (!docSlug) {
      return new Response('Doc has no slug yet — save the draft once before previewing.', {
        status: 409,
      });
    }

    const rawActorId = (req.user as { id?: string | number }).id;
    const actorId = String(rawActorId);
    const actorRel =
      typeof rawActorId === 'number' ? rawActorId : Number.parseInt(actorId, 10);
    if (!Number.isFinite(actorRel)) {
      return new Response('Invalid actor', { status: 500 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + AUTO_TTL_SECONDS * 1000).toISOString();

    const auditRow = (await req.payload.create({
      collection: 'previewAudit',
      data: {
        collection,
        docId,
        actor: actorRel,
        ttlSeconds: AUTO_TTL_SECONDS,
        expiresAt,
        label: 'auto · "Preview" button',
      },
      overrideAccess: true,
    })) as unknown as PreviewAuditRow;

    const { token } = signPreviewToken({
      collection,
      docId,
      actorId,
      auditId: String(auditRow.id),
      ttlSeconds: AUTO_TTL_SECONDS,
      now,
    });

    const target = `${webBaseUrl()}/preview/${encodeURIComponent(collection)}/${encodeURIComponent(docSlug)}?token=${encodeURIComponent(token)}`;
    return Response.redirect(target, 302);
  },
};
