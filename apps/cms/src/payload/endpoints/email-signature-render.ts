import type { Endpoint, Payload } from 'payload';

import {
  buildTokenValues,
  renderSignature,
  type SignatureRecord,
} from '../lib/email-signature/render';

/**
 * Renders one employee's signature to final email HTML.
 *
 * Rendering lives in the CMS rather than in `apps/web` so there is exactly one
 * implementation of the token contract. A second renderer on the web side
 * would have to duplicate the token list, and a drift between the two would
 * surface as a silently-empty field in a signature already pasted into
 * somebody's mail client.
 *
 * Registered as a *collection* endpoint: config-level endpoints with three or
 * more path segments 404 under this Payload version.
 */

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

interface SignatureRow extends SignatureRecord {
  id: string | number;
  slug?: string | null;
  active?: boolean | null;
  group?: string | null;
  template?: { html?: string | null; _status?: string | null } | number | string | null;
}

const findSignatureBySlug = async (
  payload: Payload,
  slug: string,
): Promise<SignatureRow | null> => {
  const result = (await payload.find({
    collection: 'emailSignatures',
    where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
    limit: 1,
    // depth: 1 populates the `template` relationship so `template.html`
    // resolves; depth 0 would return only the numeric id.
    depth: 1,
    draft: false,
    overrideAccess: true,
  })) as { docs: SignatureRow[] };
  return result.docs[0] ?? null;
};

export const emailSignatureRenderEndpoint: Endpoint = {
  path: '/:slug/render',
  method: 'get',
  handler: async (req) => {
    const slug = req.routeParams?.slug;
    if (typeof slug !== 'string' || slug.length === 0) {
      return json({ ok: false, error: 'missing_slug' }, { status: 400 });
    }

    const signature = await findSignatureBySlug(req.payload, slug);
    if (!signature) {
      // Also the offboarding path: `active: false` makes the URL stop
      // resolving without destroying the record.
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    const template = signature.template;
    // `signatureTemplates` has drafts enabled, but Payload writes the main
    // table even for a draft-only create, and `find({ draft: false })` applies
    // no `_status` filter — it is opt-in. Without this check, assigning a
    // half-finished draft template to a signature to "preview" it would serve
    // that unpublished markup to production immediately.
    const templateHtml =
      template && typeof template === 'object' && template._status === 'published'
        ? (template.html ?? null)
        : null;

    if (typeof templateHtml !== 'string' || templateHtml.trim().length === 0) {
      return json(
        { ok: false, error: 'template_unavailable', slug },
        { status: 409 },
      );
    }

    try {
      const html = renderSignature({
        templateHtml,
        values: buildTokenValues({
          name: signature.name,
          jobTitle: signature.jobTitle,
          email: signature.email,
          phoneE164: signature.phoneE164,
          phoneDisplay: signature.phoneDisplay,
        }),
      });

      return json({
        ok: true,
        slug,
        name: signature.name,
        jobTitle: signature.jobTitle,
        html,
      });
    } catch (error) {
      // A bad token or a malformed phone reaches here only if the row was
      // written through the REST API, bypassing the field validators. Fail
      // loudly rather than serve a half-rendered signature.
      req.payload.logger.error(
        { err: error, slug },
        'email signature render failed',
      );
      // Static message: the detail is already in the logger line above, and
      // this endpoint is publicly reachable.
      return json({ ok: false, error: 'render_failed' }, { status: 500 });
    }
  },
};
