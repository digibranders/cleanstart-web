import type { Field, GroupField, JSONFieldValidation } from 'payload';

import { isAdminFieldLevel } from '../access';
import { validateCanonicalOverride } from '../lib/canonical';
import {
  validateOverrideForField,
  validateOverrideForFieldOnCollection,
} from '../lib/jsonld/override-validator';
import { normaliseText } from '../lib/normalise-text';
import { normalizeKeywords } from '../lib/seo/keywords';
import { mediaUploadField } from './media-upload';

const TITLE_CHAR_HINT = 60;
const DESCRIPTION_CHAR_HINT = 160;

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
  label: 'SEO title',
  type: 'text',
  hooks: {
    beforeChange: [({ value }) => normaliseText(value)],
  },
  admin: {
    description: `SEO title. Falls back to the document title + site default. Aim for ≤ ${TITLE_CHAR_HINT} characters.`,
    // Hidden from the in-form group renderer — the editor edits this
    // via the `seoTitle` sidebar UI field instead.
    hidden: true,
  },
};

const descriptionField: Field = {
  name: 'description',
  label: 'SEO description',
  type: 'textarea',
  hooks: {
    beforeChange: [({ value }) => normaliseText(value)],
  },
  admin: {
    description: `SEO description. Falls back to the document abstract / first paragraph. Aim for ≤ ${DESCRIPTION_CHAR_HINT} characters.`,
    // Hidden from the in-form group renderer — the editor edits this
    // via the `seoDescription` sidebar UI field instead.
    hidden: true,
  },
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

// Robots-meta advanced directives.
// ----------------------------------
// `seo.indexable` (3-state) covers index / noindex / noindex,nofollow.
// This subgroup adds the secondary `<meta name="robots">` directives:
// noarchive / nosnippet / noimageindex / notranslate (booleans),
// max-snippet / max-image-preview / max-video-preview (limits), and
// unavailable_after (date). Composed into a single comma-list by
// `composeRobotsMeta()` in lib/seo/robots-meta.ts when apps/web ships.
//
// JSON-LD has no robots equivalent — these are all `<meta>`-only.
// Surfaced in the SEO advanced panel under a "Robots directives"
// subsection (collapsed by default; most pages don't need them).
const robotsAdvancedField: import('payload').GroupField = {
  name: 'robotsAdvanced',
  type: 'group',
  admin: { hidden: true },
  fields: [
    {
      name: 'noarchive',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: "Don't show a cached version in SERP." },
    },
    {
      name: 'nosnippet',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Suppress the textual snippet entirely (overrides max-snippet).' },
    },
    {
      name: 'noimageindex',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: "Don't index images on this page." },
    },
    {
      name: 'notranslate',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: "Don't show the 'Translate' link on this page." },
    },
    {
      name: 'maxSnippet',
      type: 'number',
      admin: {
        description:
          'Max characters Google may show as snippet. -1 = no limit (default), 0 = suppress.',
      },
    },
    {
      name: 'maxImagePreview',
      type: 'select',
      // Override the auto-generated enum name — the default
      // `enum_<collection>__seo_robots_advanced_max_image_preview`
      // overflows Postgres' 63-char identifier limit on collections
      // with versions enabled (which all our content collections do).
      enumName: 'enum_seo_max_image_preview',
      options: [
        { label: 'Default (standard)', value: 'standard' },
        { label: 'Large (≤1200 px) — best for Discover', value: 'large' },
        { label: 'None (no preview)', value: 'none' },
      ],
      admin: {
        description:
          "`large` is the conventional pick for photo-heavy posts targeting Google Discover.",
      },
    },
    {
      name: 'maxVideoPreview',
      type: 'number',
      admin: {
        description: 'Max seconds Google may show in a video preview. -1 = no limit, 0 = suppress.',
      },
    },
    {
      name: 'unavailableAfter',
      type: 'date',
      admin: {
        description:
          'Drop the page from the index after this date. Useful for time-bound campaigns / event landings.',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
};

// Hreflang alternates
// --------------------
// Per-page list of `<link rel="alternate" hreflang="…" href="…">`
// rows, edited via paste-and-parse on the right-rail "Head tags" card.
// Editors paste raw `<link>` tags from the source site (Eventus, etc.);
// the client component parses them on blur into structured rows that
// can be edited / removed individually.
//
// Rendering layer (apps/web + sitemap) pulls these via
// `composeHreflangCluster()` in lib/seo/hreflang.ts, which also auto-
// injects a self-reference and an `x-default` fallback so editors only
// need to paste OTHER variants. See `composeHreflangCluster.test.ts`
// for the cluster-construction contract.
//
// Hidden from the in-form group renderer — editing surface is the
// `HeadTagsCard` Hreflang section.
// Stored as JSON, not as a Payload `array`. The `array` machinery
// requires the field to render somewhere so its row state registers
// in the form, and our parent `seoFieldHidden` group is hidden in the
// in-form area. JSON sidesteps the row registry entirely — the
// sidebar `HeadTagsCard` reads/writes the blob via `useField` +
// `setValue`. Defensive normalisation lives in
// `lib/seo/hreflang.ts` so malformed shapes never reach renderers.
const alternatesField: Field = {
  name: 'alternates',
  type: 'json',
  admin: { hidden: true },
};

// Custom head tags
// -----------------
// Curated escape hatch for one-off `<meta>` tags. Two kinds in v1:
//   meta-name     → `<meta name="…" content="…">`
//   meta-property → `<meta property="…" content="…">`
//
// Covers ≈ 95% of real-world per-page tag asks (news_keywords,
// format-detection, og:video, twitter:player, custom og:type, etc.)
// without exposing a raw-HTML textarea. Editor picks a kind, fills
// `key` + `content`. Composed by `composeCustomTags()` in
// lib/seo/custom-tags.ts when apps/web ships.
//
// Hidden from the in-form group renderer — editing surface is the
// `HeadTagsCard` in the right rail.
// Same JSON-blob storage as `alternatesField` — see comment above.
// Shape: `Array<{ kind: 'meta-name' | 'meta-property', key, content }>`.
const customTagsField: Field = {
  name: 'customTags',
  type: 'json',
  admin: { hidden: true },
};

// Canonical-URL behaviour
// ------------------------
// Every page is self-canonical by default: JSON-LD `url` /
// `mainEntityOfPage` / `@id` are built from `<baseUrl><route-prefix>/
// <slug>` via `docCanonicalUrl()` (see lib/jsonld/url.ts). When
// `seo.useCustomCanonical === true` AND `seo.canonicalOverride` is a
// valid absolute https URL (any domain — same-domain or cross-domain
// are both legitimate), the override wins.
//
// Same-domain canonical is the right tool for facet / parameter
// stripping, A/B test variants, paginated slices, and migrated URL
// preservation — i.e. when the variant URL must keep serving content
// but only one canonical URL should be indexed. Cross-domain
// canonical is for syndicated content (Medium, partner sites, etc.).
//
// The two data fields below stay hidden from the in-form group
// renderer; the editing surface is the right-rail `CanonicalField`
// card mounted via `seoSidebarFields()`.
const useCustomCanonicalField: Field = {
  name: 'useCustomCanonical',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    hidden: true,
  },
};

const canonicalOverrideField: Field = {
  name: 'canonicalOverride',
  type: 'text',
  admin: {
    hidden: true,
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
 *    admin types (the editor lives in `SchemaPreviewField.tsx`).
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
      'Admin-only escape hatch for one-off Schema.org markup. Validated against an allowlist of @types and capped at 16 KB. Every change writes an audit-log row. Edited from the Schema (JSON-LD) sidebar card.',
    // No custom Field renderer — the editing UI is owned by the
    // unified Schema (JSON-LD) sidebar card (SchemaPreviewField). Setting
    // `hidden: true` keeps the raw JSON field from also rendering inside
    // the SEO Advanced group (would be a duplicate editing surface).
    hidden: true,
  },
  validate: ((value: unknown, ctx: unknown): true | string => {
    const req = (ctx as { req?: { collection?: { config?: { slug?: string } } } }).req;
    const slug = req?.collection?.config?.slug ?? null;
    if (slug == null || slug.length === 0) {
      return validateOverrideForField(value);
    }
    return validateOverrideForFieldOnCollection(slug)(value);
  }) as JSONFieldValidation,
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

// Topic keywords — a normalized list of entity terms for this page.
// Distinct from `keywordTarget` (the single focus keyword that drives
// the density readout): this is the *entity set* surfaced as schema.org
// `keywords` + `mentions[]` (AEO/GEO signal) and indexed as a search
// facet. Stored as a `json` blob (a `string[]`) — same storage choice
// as `alternates` / `customTags`, because the parent `seo` group is
// `admin.hidden` and Payload's `array` row-registry needs an in-form
// render surface. The `SeoKeywordsField` sidebar card reads/writes the
// blob via `useField` + `setValue`. Normalized on every save so the
// stored shape is always a clean, de-duped, capped array (or null).
const keywordsField: Field = {
  name: 'keywords',
  type: 'json',
  admin: { hidden: true },
  hooks: {
    beforeChange: [
      ({ value }) => {
        const cleaned = normalizeKeywords(value);
        return cleaned.length > 0 ? cleaned : null;
      },
    ],
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
const seoField: GroupField = {
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
    robotsAdvancedField,
    alternatesField,
    customTagsField,
    keywordTargetField,
    keywordsField,
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
      // Topic keywords — entity terms surfaced in JSON-LD (`keywords` +
      // `mentions[]`) and indexed as a search facet. Sits in the
      // "what indexes / entities" cluster next to the Schema preview.
      name: 'seoKeywords',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/SeoKeywordsField.tsx#SeoKeywordsField',
          },
        },
      },
    },
    {
      // Canonical-URL card — surfaces the self-canonical that JSON-LD
      // emits by default, and lets editors override with an off-domain
      // canonical when content was originally published elsewhere.
      // The override flows through `docCanonicalUrl()` in
      // lib/jsonld/url.ts and replaces the self-URL in every JSON-LD
      // `url` / `mainEntityOfPage` / `@id` field.
      name: 'canonicalUrl',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/CanonicalField.tsx#CanonicalField',
            clientProps: { pathPrefix, sourceField: urlSource },
          },
        },
      },
    },
    {
      // Social Card — OG image upload + alt + Facebook/X/LinkedIn live
      // preview. Promoted out of `SeoAdvancedPanel` so the OG image
      // (touched on ~40% of edits) is one click away instead of three
      // card-expansions deep. Collapsed by default; sits below
      // Canonical so the SERP/Schema/Canonical "what indexes" cluster
      // stays contiguous, with social-share controls following.
      name: 'socialCard',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/SocialCardField.tsx#SocialCardField',
          },
        },
      },
    },
    {
      // Renamed from "outboundRedirect"; the inbound-redirect sidebar
      // card was removed (a page doesn't need to surface every URL
      // pointing AT it inside its own edit view — the Redirects
      // collection list is the place for that audit). What remains is
      // the simpler "this page redirects to ___" affordance, labelled
      // simply "Redirect" in the UI.
      name: 'redirect',
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
      // "Head/Header tags" — collapsed-by-default card with three
      // sections: Quick add (universal paste), Other language versions
      // (hreflang `seo.alternates`), Extra meta tags (`seo.customTags`).
      // Robots directives intentionally NOT here — they live in the
      // existing SEO Advanced surface so all advanced SEO controls
      // stay in one place. Sits above URL change history so editors
      // working on hreflang / meta tags don't have to scroll past a
      // read-only audit log to reach an active editing surface.
      name: 'headTags',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/HeadTagsCard.tsx#HeadTagsCard',
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
  ];
};
