import type { Field, GroupField } from 'payload';

import { isAdminFieldLevel } from '../access';
import { validateCanonicalOverride } from '../lib/canonical';
import { validateOverrideForField } from '../lib/jsonld/override-validator';
import { mediaUploadField } from './media-upload';

const TITLE_CHAR_HINT = 60;
const DESCRIPTION_CHAR_HINT = 160;
// Hard caps. Above these, Google reliably truncates the SERP snippet —
// over-long values waste pixels we already paid for. The sidebar UI
// shows soft warnings at the hint thresholds; these constants are the
// last line of defence at save time.
const TITLE_CHAR_LIMIT = 70;
const DESCRIPTION_CHAR_LIMIT = 170;

const validateSeoTitleLength = (
  value: string | string[] | null | undefined,
): true | string => {
  if (typeof value !== 'string') return true;
  if (value.length <= TITLE_CHAR_LIMIT) return true;
  return `SEO title is ${value.length} characters — Google truncates above ${TITLE_CHAR_LIMIT}. Aim for ≤ ${TITLE_CHAR_HINT}.`;
};

const validateSeoDescriptionLength = (
  value: string | string[] | null | undefined,
): true | string => {
  if (typeof value !== 'string') return true;
  if (value.length <= DESCRIPTION_CHAR_LIMIT) return true;
  return `SEO description is ${value.length} characters — Google truncates above ${DESCRIPTION_CHAR_LIMIT}. Aim for ≤ ${DESCRIPTION_CHAR_HINT}.`;
};

const indexableField: Field = {
  name: 'indexable',
  type: 'select',
  defaultValue: 'index',
  options: [
    { label: 'Index (default)', value: 'index' },
    { label: 'No-index', value: 'noindex' },
    { label: 'No-index, no-follow', value: 'noindex,nofollow' },
  ],
  admin: {
    description:
      "When set to no-index, the page is excluded from /sitemap.xml and Google won't show it.",
    // Hidden from the in-form group renderer — the editor edits this
    // via the `seoIndexable` sidebar UI field instead. Data still
    // persists at `seo.indexable`.
    hidden: true,
  },
};

const titleField: Field = {
  name: 'title',
  type: 'text',
  admin: {
    description: `SEO title. Falls back to the document title + site default. Aim for ≤ ${TITLE_CHAR_HINT} characters.`,
    // Hidden from the in-form group renderer — the editor edits this
    // via the `seoTitle` sidebar UI field instead.
    hidden: true,
  },
  validate: validateSeoTitleLength,
};

const descriptionField: Field = {
  name: 'description',
  type: 'textarea',
  admin: {
    description: `SEO description. Falls back to the document abstract / first paragraph. Aim for ≤ ${DESCRIPTION_CHAR_HINT} characters.`,
    // Hidden from the in-form group renderer — the editor edits this
    // via the `seoDescription` sidebar UI field instead.
    hidden: true,
  },
  validate: validateSeoDescriptionLength,
};

const ogImageFields: Field[] = [
  mediaUploadField({
    name: 'ogImage',
    folderHint: 'web/general',
    description:
      'Falls back to the hero image, then the site default OG image. Derivatives served at 1200×630 (OGP) and 1200×675 (Discover).',
  }),
  {
    name: 'ogImageAlt',
    type: 'text',
    admin: {
      description:
        'Override for the og:image alt text. Falls back to the alt text on the linked media asset.',
      condition: (_data, siblingData) => Boolean(siblingData?.ogImage),
    },
  },
];

const useAdvancedOgField: Field = {
  name: 'useAdvancedOg',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    description:
      'Show fields to override the og:title / og:description independently of the SEO title / description.',
  },
};

const advancedOgFields: Field[] = [
  {
    name: 'ogTitle',
    type: 'text',
    admin: {
      description: 'Defaults to the SEO title. Most editors never need to override this.',
      condition: (_data, siblingData) => siblingData?.useAdvancedOg === true,
    },
  },
  {
    name: 'ogDescription',
    type: 'textarea',
    admin: {
      description: 'Defaults to the SEO description.',
      condition: (_data, siblingData) => siblingData?.useAdvancedOg === true,
    },
  },
];

// Twitter / X card overrides. The default fallback chain is:
//   twitterImage → ogImage → site default OG image
//   twitterTitle → ogTitle → seo.title → doc title
//   twitterDescription → ogDescription → seo.description → abstract
// Editors only flip useAdvancedTwitter when the X audience needs a
// different framing than the OG/Facebook audience — mostly for tone or
// cropping. The renderer applies the fallback chain.
const useAdvancedTwitterField: Field = {
  name: 'useAdvancedTwitter',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    description:
      "Show fields to override the X (Twitter) card independently of the OG card. Most editors don't need this — by default the OG fields drive the X card too.",
  },
};

const advancedTwitterFields: Field[] = [
  {
    name: 'twitterCard',
    type: 'select',
    defaultValue: 'summary_large_image',
    options: [
      { label: 'Summary (small image)', value: 'summary' },
      { label: 'Summary with large image (default)', value: 'summary_large_image' },
    ],
    admin: {
      description:
        '`summary_large_image` is the right choice for almost every page; only switch to `summary` for thin content like author / category index pages.',
      condition: (_data, siblingData) => siblingData?.useAdvancedTwitter === true,
    },
  },
  {
    name: 'twitterTitle',
    type: 'text',
    admin: {
      description: 'Defaults to ogTitle, then SEO title.',
      condition: (_data, siblingData) => siblingData?.useAdvancedTwitter === true,
    },
  },
  {
    name: 'twitterDescription',
    type: 'textarea',
    admin: {
      description: 'Defaults to ogDescription, then SEO description.',
      condition: (_data, siblingData) => siblingData?.useAdvancedTwitter === true,
    },
  },
  mediaUploadField({
    name: 'twitterImage',
    folderHint: 'web/general',
    description:
      'Defaults to ogImage, then the site default OG image. Use a different crop here when the OG image is portrait or has wide letterboxing — X clips aggressively at 2:1.',
    condition: (_data, siblingData) =>
      (siblingData as { useAdvancedTwitter?: boolean } | undefined)?.useAdvancedTwitter === true,
  }),
];

const useCustomCanonicalField: Field = {
  name: 'useCustomCanonical',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    description:
      'Only enable when this content was originally published elsewhere and you want Google to credit the original URL. For duplicate pages on cleanstart.com, use a redirect instead.',
  },
};

const canonicalOverrideField: Field = {
  name: 'canonicalOverride',
  type: 'text',
  admin: {
    description:
      'Off-domain canonical URL (HTTPS, no query/fragment). Validated at save time. Every change writes an audit row.',
    condition: (_data, siblingData) => siblingData?.useCustomCanonical === true,
  },
  validate: (
    value: string | string[] | null | undefined,
    {
      siblingData,
    }: { siblingData?: { useCustomCanonical?: boolean } },
  ): true | string => {
    if (siblingData?.useCustomCanonical !== true) return true;
    const raw = typeof value === 'string' ? value : null;
    const result = validateCanonicalOverride(raw);
    if (result.ok) return true;
    if (result.severity === 'warn') return true;
    return result.message;
  },
};

/**
 * Tier 3 of the Schema sidebar plan — admin-only raw JSON-LD override.
 *
 * Field-level `access` strips this field from the form payload entirely
 * for non-admins (not just hidden in DevTools — Payload removes it
 * from the sanitised doc on read AND blocks updates server-side).
 *
 * Validation is doubled up:
 *  - Server `validate` callback runs the strict Zod schema on every
 *    save and blocks the write with a specific error.
 *  - Client UI re-runs the same validator for live feedback as the
 *    admin types (see `SchemaOverrideField.tsx`).
 *
 * The dispatcher consumes this field LAST in the JSON-LD graph so
 * admin overrides take precedence over Layer 1 + Layer 2 add-ons,
 * and emits a `console.warn` when an override is in use so the canary
 * stream surfaces which pages have manual markup.
 */
const additionalSchemaField: Field = {
  name: 'additionalSchema',
  type: 'json',
  access: {
    read: isAdminFieldLevel,
    update: isAdminFieldLevel,
    create: isAdminFieldLevel,
  },
  admin: {
    description:
      'Admin-only escape hatch for one-off Schema.org markup. Validated against an allowlist of @types and capped at 16 KB. Every change writes an audit-log row.',
    components: {
      Field: {
        path: '@/payload/admin/components/SchemaOverrideField.tsx#SchemaOverrideField',
      },
    },
  },
  validate: validateOverrideForField,
};

// Optional target keyword the editor is writing for. Drives the
// `KeywordTargetField` sidebar density readout. Free-text — we don't
// validate against an external keyword tool. Hidden from the in-form
// renderer; the sidebar UI is the editing surface.
const keywordTargetField: Field = {
  name: 'keywordTarget',
  type: 'text',
  admin: {
    hidden: true,
    description:
      'Target keyword / phrase for this page. Drives the density readout in the sidebar — body 1–2.5% is the conventional sweet spot.',
  },
};

const speakablePathField: Field = {
  name: 'speakablePath',
  type: 'array',
  labels: { singular: 'Selector', plural: 'Selectors' },
  admin: {
    description:
      "CSS selectors marking paragraphs eligible for Schema.org Speakable JSON-LD (voice assistants and AI agents reading aloud). Empty = the lead + first body paragraph are auto-marked.",
  },
  fields: [
    {
      name: 'selector',
      type: 'text',
      required: true,
    },
  ],
};

/**
 * Top-level SEO group. Title / Description / Indexable still live
 * here in the data shape (`seo.title`, `seo.description`,
 * `seo.indexable`) but are `admin.hidden: true` so the in-form group
 * renderer skips them. Editors edit those three via the sidebar UI
 * fields exported as `seoSidebarFields()` below — which keeps the
 * highest-traffic, highest-impact SEO controls glanceable while
 * writing, and pushes advanced og/canonical/speakable controls into
 * a calmer, less-frequently visited section of the form.
 */
export const seoField: GroupField = {
  name: 'seo',
  type: 'group',
  label: 'SEO advanced',
  admin: {
    description:
      'Open-graph image, canonical override, and Schema.org speakable selectors. The most-used SEO fields (title, description, indexable) live in the right sidebar.',
  },
  fields: [
    titleField,
    descriptionField,
    indexableField,
    ...ogImageFields,
    useAdvancedOgField,
    ...advancedOgFields,
    useAdvancedTwitterField,
    ...advancedTwitterFields,
    useCustomCanonicalField,
    canonicalOverrideField,
    keywordTargetField,
    speakablePathField,
    additionalSchemaField,
  ],
};

/**
 * Hidden variant of `seoField` — same data shape, but the group itself
 * is skipped by the in-form renderer. Used by collections that surface
 * the advanced SEO controls (OG image, advanced OG copy, custom
 * canonical, speakable selectors) via the right-rail
 * `SeoAdvancedPanel` instead of as a bottom-of-form group.
 *
 * Schema, validators, hooks, and audit logic are untouched — only the
 * render surface moves.
 */
export const seoFieldHidden: GroupField = {
  ...seoField,
  admin: {
    ...(seoField.admin ?? {}),
    hidden: true,
  },
};

/**
 * Sidebar UI field that mounts the `SeoAdvancedPanel` collapsible card.
 * Pass the collection slug as `storageKey` so each collection remembers
 * its own expanded/collapsed state per editor.
 */
export const seoAdvancedSidebarField = (args: { storageKey: string }): Field => ({
  name: 'seoAdvanced',
  type: 'ui',
  admin: {
    position: 'sidebar',
    components: {
      Field: {
        path: '@/payload/admin/components/SeoAdvancedPanel.tsx#SeoAdvancedPanel',
        clientProps: { storageKey: args.storageKey },
      },
    },
  },
});

/**
 * One-call helper a collection can use to install both the hidden
 * `seoField` data group and the sidebar `SeoAdvancedPanel` UI in a
 * single spread. Each collection's diff for the SEO consolidation is
 * one line: replace `seoField` with `...seoFieldsForSidebar(slug)`.
 */
export const seoFieldsForSidebar = (storageKey: string): Field[] => [
  seoFieldHidden,
  seoAdvancedSidebarField({ storageKey }),
];

/**
 * Returns the sidebar UI fields a content collection should splice
 * into its sidebar above `Featured` / `Pinned`:
 *   - SEO Title (auto-synced from a configurable source field, char counter)
 *   - SEO Description (auto-synced from a configurable source field)
 *   - SEO Indexable (3-chip segmented control)
 *   - SERP Preview (Google snippet mockup)
 *   - Schema (JSON-LD) preview card with spec-compliance badge
 *   - Inbound Redirects card (read-only list + "Add" deep-link)
 *
 * `pathPrefix`, `titleSource`, `descriptionSource`, and `urlSource`
 * let each collection wire its own URL prefix + which doc-level
 * fields the SEO title / description / public URL mirror from. Most
 * content collections have a `title` + `slug`; Authors / Categories
 * use `name`; Pages compute a full nested `path`.
 */
export const seoSidebarFields = (args: {
  pathPrefix: string;
  titleSource?: string;
  descriptionSource?: string;
  /**
   * Doc-level field that owns the URL part. `slug` for most
   * collections, `path` for Pages.
   */
  urlSource?: string;
}): Field[] => {
  const {
    pathPrefix,
    titleSource = 'title',
    descriptionSource = 'abstract',
    urlSource = 'slug',
  } = args;
  return [
    {
      name: 'seoHealthScore',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/SeoHealthScoreField.tsx#SeoHealthScoreField',
            clientProps: { titleSource, descriptionSource, urlSource },
          },
        },
      },
    },
    {
      name: 'seoTitle',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/SeoTitleField.tsx#SeoTitleField',
            clientProps: { path: 'seo.title', sourceField: titleSource },
          },
        },
      },
    },
    {
      name: 'seoDescription',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/SeoDescriptionField.tsx#SeoDescriptionField',
            clientProps: { path: 'seo.description', sourceField: descriptionSource },
          },
        },
      },
    },
    {
      name: 'seoIndexable',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/SeoIndexableField.tsx#SeoIndexableField',
            clientProps: { path: 'seo.indexable' },
          },
        },
      },
    },
    {
      name: 'serpPreview',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/SerpPreviewField.tsx#SerpPreviewField',
            clientProps: { pathPrefix, titleSource, descriptionSource, urlSource },
          },
        },
      },
    },
    {
      name: 'schemaPreview',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/SchemaPreviewField.tsx#SchemaPreviewField',
            clientProps: { pathPrefix, sourceField: urlSource },
          },
        },
      },
    },
    {
      name: 'inboundRedirects',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/InboundRedirectsField.tsx#InboundRedirectsField',
            clientProps: { pathPrefix, sourceField: urlSource },
          },
        },
      },
    },
    {
      name: 'outboundRedirect',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/OutboundRedirectField.tsx#OutboundRedirectField',
            clientProps: { pathPrefix, sourceField: urlSource },
          },
        },
      },
    },
    {
      name: 'urlChangeHistory',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/UrlChangeHistoryField.tsx#UrlChangeHistoryField',
            clientProps: { pathPrefix, sourceField: urlSource },
          },
        },
      },
    },
    {
      name: 'bodyAudit',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/BodyAuditField.tsx#BodyAuditField',
          },
        },
      },
    },
    {
      name: 'keywordTargetUi',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/KeywordTargetField.tsx#KeywordTargetField',
            clientProps: { titleSource, descriptionSource },
          },
        },
      },
    },
  ];
};
