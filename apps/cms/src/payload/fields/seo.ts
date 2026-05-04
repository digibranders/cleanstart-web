import type { Field, GroupField } from 'payload';

import { validateCanonicalOverride } from '../lib/canonical';

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
  },
};

const titleField: Field = {
  name: 'title',
  type: 'text',
  admin: {
    description: `SEO title. Falls back to the document title + site default. Aim for ≤ ${TITLE_CHAR_HINT} characters.`,
  },
};

const descriptionField: Field = {
  name: 'description',
  type: 'textarea',
  admin: {
    description: `SEO description. Falls back to the document abstract / first paragraph. Aim for ≤ ${DESCRIPTION_CHAR_HINT} characters.`,
  },
};

const ogImageFields: Field[] = [
  {
    name: 'ogImage',
    type: 'upload',
    relationTo: 'media',
    admin: {
      description:
        'Falls back to the hero image, then the site default OG image. Derivatives served at 1200×630 (OGP) and 1200×675 (Discover).',
    },
  },
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

export const seoField: GroupField = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  admin: {
    description:
      'On-page SEO surface. Most fields auto-fall-back from typed document fields and site defaults; only override when you have a specific reason.',
  },
  fields: [
    titleField,
    descriptionField,
    indexableField,
    ...ogImageFields,
    useAdvancedOgField,
    ...advancedOgFields,
    useCustomCanonicalField,
    canonicalOverrideField,
    speakablePathField,
  ],
};
