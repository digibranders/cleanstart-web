import type { Block, Field } from 'payload';

import { mediaUploadField } from './media-upload';

/**
 * Layer 2 schema add-ons. Editors layer these on top of the auto-
 * emitted Layer 1 (Article / Event / WebPage / etc.) without touching
 * raw JSON. Each block type below maps 1:1 to a schema.org @type and
 * exposes only the fields that schema.org requires + the high-value
 * recommended ones — Google's Rich Results test rejects malformed
 * blobs, so we trade configurability for spec correctness.
 *
 * The dispatcher in `lib/jsonld/addons/dispatch.ts` reads the
 * resulting `schemaAddons[]` array and appends one blob per block to
 * the page's `@graph`, after Layer 1 and before any admin override.
 */

const howToBlock: Block = {
  slug: 'howTo',
  labels: { singular: 'HowTo', plural: 'HowTo blocks' },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: { description: 'One-paragraph summary of the procedure.' },
    },
    {
      name: 'totalTime',
      type: 'text',
      admin: {
        description:
          'ISO 8601 duration (e.g. PT15M = 15 minutes, PT1H30M = 1.5 hours).',
      },
    },
    {
      name: 'steps',
      type: 'array',
      labels: { singular: 'Step', plural: 'Steps' },
      minRows: 2,
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'text',
          type: 'textarea',
          required: true,
          admin: { description: 'What the reader should do for this step.' },
        },
        mediaUploadField({
          name: 'image',
          folderHint: 'web/general',
          description: 'Optional supporting image (1200×675 ideal).',
        }),
      ],
    },
  ],
};

const videoObjectBlock: Block = {
  slug: 'videoObject',
  labels: { singular: 'Video', plural: 'Video blocks' },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    mediaUploadField({
      name: 'thumbnail',
      required: true,
      folderHint: 'web/general',
      description: 'Required by Google. 1200×675 ideal, 16:9 minimum.',
    }),
    {
      name: 'uploadDate',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'contentUrl',
      type: 'text',
      required: true,
      admin: {
        description:
          'Direct video URL (e.g. .mp4) — used by Google for in-SERP playback. Use embedUrl below for YouTube/Vimeo embeds.',
      },
    },
    {
      name: 'embedUrl',
      type: 'text',
      admin: {
        description:
          'Optional iframe-embeddable URL (YouTube/Vimeo). Required by Google when the player is embedded rather than self-hosted.',
      },
    },
    {
      name: 'duration',
      type: 'text',
      admin: { description: 'ISO 8601 duration (e.g. PT5M30S).' },
    },
  ],
};

const faqPageBlock: Block = {
  slug: 'faqPage',
  labels: { singular: 'FAQ entry', plural: 'FAQ entries' },
  fields: [
    {
      name: 'questions',
      type: 'array',
      labels: { singular: 'Question', plural: 'Questions' },
      minRows: 1,
      admin: {
        description:
          'Curated Q&A merged into the page FAQPage blob. If the doc already auto-emits FAQ from its `faqs[]` field, these entries are concatenated rather than duplicated.',
      },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
};

const reviewBlock: Block = {
  slug: 'review',
  labels: { singular: 'Review', plural: 'Reviews' },
  fields: [
    {
      name: 'itemReviewedType',
      type: 'select',
      required: true,
      defaultValue: 'Product',
      options: [
        { label: 'Product', value: 'Product' },
        { label: 'Service', value: 'Service' },
        { label: 'SoftwareApplication', value: 'SoftwareApplication' },
        { label: 'Organization', value: 'Organization' },
      ],
    },
    { name: 'itemReviewedName', type: 'text', required: true },
    {
      name: 'ratingValue',
      type: 'number',
      required: true,
      min: 0,
      max: 5,
      admin: { description: '0–5 (use whole or half-stars: 0, 0.5, 1, 1.5, …, 5).' },
    },
    { name: 'reviewBody', type: 'textarea' },
    {
      name: 'authorName',
      type: 'text',
      admin: {
        description: 'Reviewer name (Person). Falls back to the doc author.',
      },
    },
  ],
};

// Field names within blocks scoped to a versioned collection generate
// enum/index identifiers like `enum__<collection>_v_blocks_<block>_<field>`,
// which Postgres caps at 63 characters. We use the SHORTEST field names
// that still read sensibly here, and the builder remaps them to the full
// schema.org property names on JSON-LD output.
const softwareApplicationBlock: Block = {
  slug: 'softwareApp',
  labels: { singular: 'Software', plural: 'Software blocks' },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'BusinessApplication',
      label: 'Application category',
      options: [
        { label: 'Business', value: 'BusinessApplication' },
        { label: 'Developer / DevOps', value: 'DeveloperApplication' },
        { label: 'Security', value: 'SecurityApplication' },
        { label: 'Communication', value: 'CommunicationApplication' },
      ],
    },
    {
      name: 'os',
      type: 'text',
      required: true,
      label: 'Operating system',
      admin: {
        description: 'OS support (e.g. "Linux", "macOS, Windows", "Web").',
      },
    },
    {
      name: 'price',
      type: 'text',
      required: true,
      admin: {
        description:
          'Price as a string (e.g. "0", "29.00"). Use "0" for free / open-source.',
      },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'USD',
      label: 'Price currency',
      options: [
        { label: 'USD', value: 'USD' },
        { label: 'EUR', value: 'EUR' },
        { label: 'GBP', value: 'GBP' },
        { label: 'INR', value: 'INR' },
      ],
    },
    {
      name: 'ratingValue',
      type: 'number',
      min: 0,
      max: 5,
      label: 'Average rating',
      admin: { description: 'Average rating, 0–5. Optional.' },
    },
    {
      name: 'ratingCount',
      type: 'number',
      min: 0,
      label: 'Rating count',
      admin: {
        description: 'Number of ratings. Required if Average rating is set.',
        condition: (_data, sibling) =>
          typeof (sibling as { ratingValue?: number } | undefined)?.ratingValue === 'number',
      },
    },
  ],
};

const breadcrumbToggleBlock: Block = {
  slug: 'breadcrumbList',
  labels: { singular: 'Breadcrumb override', plural: 'Breadcrumb overrides' },
  fields: [
    {
      name: 'mode',
      type: 'select',
      required: true,
      defaultValue: 'suppress',
      admin: {
        description:
          'BreadcrumbList is auto-emitted today. Use this override to suppress the auto crumb on a flat page, or to replace it with custom crumbs.',
      },
      options: [
        { label: 'Suppress auto breadcrumb', value: 'suppress' },
        { label: 'Replace with custom crumbs', value: 'replace' },
      ],
    },
    {
      name: 'crumbs',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Crumb', plural: 'Crumbs' },
      admin: {
        condition: (_data, sibling) =>
          (sibling as { mode?: string } | undefined)?.mode === 'replace',
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'path',
          type: 'text',
          required: true,
          admin: { description: 'Site-relative path (e.g. /solutions/pricing) or full URL.' },
        },
      ],
    },
  ],
};

export const SCHEMA_ADDON_BLOCKS: Block[] = [
  howToBlock,
  videoObjectBlock,
  faqPageBlock,
  reviewBlock,
  softwareApplicationBlock,
  breadcrumbToggleBlock,
];

/**
 * Schema add-ons array — top-level field on each content collection.
 * Each entry is one of the six blocks above; the dispatcher walks the
 * list and appends a blob per entry to the page's `@graph`.
 */
export const schemaAddonsField: Field = {
  name: 'schemaAddons',
  type: 'blocks',
  labels: { singular: 'Schema add-on', plural: 'Schema add-ons' },
  admin: {
    description:
      'Layer in extra Schema.org types (HowTo, Video, Review, etc.) on top of the auto-emitted JSON-LD. Editors never write raw JSON — every field below maps to a schema.org property.',
  },
  blocks: SCHEMA_ADDON_BLOCKS,
};
