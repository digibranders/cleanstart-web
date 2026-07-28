import type { CollectionConfig } from 'payload';

import { isAdmin, publishedOrAuthenticated } from '../access';
import { SIGNATURE_TOKENS, extractTokens, unknownTokens } from '../lib/email-signature/render';
import { slugField } from '../fields/slug';

/** `{{name}}, {{jobTitle}}, …` — the contract rendered for editor-facing copy. */
const PLACEHOLDER_LIST = SIGNATURE_TOKENS.map((token) => `{{${token}}}`).join(', ');

/**
 * Constructs that never appear in a legitimate email signature and that would
 * each defeat a defence elsewhere:
 *
 *  - `<script>`/`<iframe>`/`<object>`/`<embed>`/`<base>`/`<form>` — execution
 *    and navigation vectors. Mail clients strip them anyway, so rejecting them
 *    costs nothing.
 *  - `<meta http-equiv>` — a refresh redirect, which no CSP directive can stop
 *    (`navigate-to` shipped in no browser).
 *  - `on*=` handlers — the payload that would otherwise ride the copy path.
 *  - `javascript:`/`data:`/`vbscript:` URLs.
 */
const FORBIDDEN_MARKUP: readonly { pattern: RegExp; reason: string }[] = [
  { pattern: /<\s*(script|iframe|object|embed|base|form)\b/i, reason: 'executable or navigating elements' },
  { pattern: /<\s*meta\b[^>]*http-equiv/i, reason: '<meta http-equiv> (redirects cannot be blocked by CSP)' },
  { pattern: /\son[a-z]+\s*=/i, reason: 'inline event handlers (on*=)' },
  { pattern: /(?:href|src)\s*=\s*["']?\s*(?:javascript|data|vbscript):/i, reason: 'javascript:/data:/vbscript: URLs' },
];

/**
 * A token in an unquoted attribute, e.g. `<td class={{jobTitle}}>`.
 *
 * The renderer HTML-escapes every value, which is correct in a text node and
 * in a quoted attribute — but not in an unquoted one, where a space in the
 * value ends the attribute and the rest is parsed as markup. Job titles are
 * editor-editable, so this is the one path that would turn an editor into an
 * XSS author. Rejecting the shape here is what makes the renderer's stated
 * invariant actually true.
 */
const UNQUOTED_TOKEN = /=\s*\{\{/;

/**
 * The markup half of an email signature. One row holds the table-based HTML
 * every employee shares; `emailSignatures` rows supply the per-person data.
 *
 * Splitting it this way is what the migrated files argued for: all 20 legacy
 * signature files were byte-identical apart from name/title/email/phone, and
 * the only differences that had crept in were formatter drift (`padding-right:
 * 6px` vs `8px`, a stray `line-height`) that nobody intended and nobody could
 * see. With one stored template that class of bug cannot recur.
 *
 * Write access is admin-only. The `html` field is raw markup rendered on a
 * cleanstart.com route, so it is a privileged-paste surface — the same reason
 * `seo.additionalSchema` is restricted rather than open to editors.
 */
export const SignatureTemplates: CollectionConfig = {
  slug: 'signatureTemplates',
  labels: { singular: 'Signature Template', plural: 'Signature Templates' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'isDefault', 'updatedAt'],
    group: 'Brand',
    description:
      'Email-signature markup. Use {{name}}, {{jobTitle}}, {{email}}, {{phone}} and {{phoneHref}} as placeholders.',
  },
  access: {
    // Published templates are public so the render endpoint and any preview
    // can read them anonymously; drafts are not, or an unpublished template
    // (including one pulled *because* it was bad) would stay readable via
    // `?draft=true`.
    read: publishedOrAuthenticated,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Editor-facing name, e.g. "CleanStart Standard 2026".' },
    },
    slugField({ source: 'name' }),
    {
      name: 'html',
      type: 'code',
      required: true,
      admin: {
        language: 'html',
        description: `Table-based HTML with inline styles — the only markup Outlook renders reliably. Placeholders: ${PLACEHOLDER_LIST}. Reference images by absolute CDN URL (see Email Assets); relative paths do not resolve in a mail client.`,
      },
      validate: (value: string | null | undefined): true | string => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Template HTML is required.';
        }

        const unknown = unknownTokens(value);
        if (unknown.length > 0) {
          // Without this check a typo renders an empty string and the broken
          // signature ships to a customer's inbox with no error anywhere.
          return `Unknown placeholder${unknown.length > 1 ? 's' : ''} ${unknown
            .map((token) => `{{${token}}}`)
            .join(', ')}. Supported: ${PLACEHOLDER_LIST}.`;
        }

        for (const { pattern, reason } of FORBIDDEN_MARKUP) {
          if (pattern.test(value)) {
            return `Template contains ${reason}. Email clients strip these, and they would run on cleanstart.com when the signature is previewed or copied.`;
          }
        }

        if (UNQUOTED_TOKEN.test(value)) {
          return 'Every placeholder used in an attribute must be quoted, e.g. style="…{{name}}…". Unquoted attribute values let a job title break out of the tag.';
        }

        // Every token must be present, not just {{name}}. The template was
        // derived by substituting one real employee's details out of their
        // legacy file, so a token that gets deleted leaves that person's
        // literal value baked into the markup — drop {{email}} and every
        // employee's signature silently ships the CEO's address.
        const present = extractTokens(value);
        const missing = SIGNATURE_TOKENS.filter((token) => !present.includes(token));
        if (missing.length > 0) {
          return `Template is missing ${missing
            .map((token) => `{{${token}}}`)
            .join(', ')}. Every placeholder must appear, otherwise the value it replaced stays hard-coded for everyone.`;
        }

        return true;
      },
    },
    {
      // Live render of the template beside the editor. Sidebar-positioned so
      // it stays visible while scrolling a few hundred lines of table markup.
      name: '_preview',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/SignatureTemplatePreview.tsx#SignatureTemplatePreview',
          },
        },
      },
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Pre-selected for new signatures. Setting this clears it on other templates.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        description: 'What this template is for, and anything a future editor should know.',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, previousDoc, operation }) => {
        const next = doc as { isDefault?: boolean; _status?: string };
        if (next.isDefault !== true) return;

        // Draft saves still fire afterChange, but Payload does NOT write the
        // main table for them. Sweeping here would clear the live default
        // while the new one only exists as a draft — leaving zero defaults
        // from an edit that was never published.
        if (next._status !== 'published') return;

        // Only reconcile when the flag actually turned on, so an unrelated
        // edit to the current default does not re-run the sweep.
        const prev = previousDoc as { isDefault?: boolean; _status?: string } | undefined;
        if (operation === 'update' && prev?.isDefault === true && prev?._status === 'published') {
          return;
        }

        // `req` is passed so this joins the caller's transaction: if the outer
        // save rolls back, the old default is not left already cleared.
        // Safe against recursion — the updated rows are set to `isDefault:
        // false`, so their own afterChange returns at the first guard.
        await req.payload.update({
          collection: 'signatureTemplates',
          where: { and: [{ isDefault: { equals: true } }, { id: { not_equals: doc.id } }] },
          data: { isDefault: false },
          overrideAccess: true,
          req,
        });
      },
    ],
  },
  versions: { drafts: true },
  timestamps: true,
};
