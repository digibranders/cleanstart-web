import type { CollectionConfig, JSONFieldValidation } from 'payload';

import { isAdminOrEditor } from '../access';
import { validateOverrideForFieldOnCollection } from '../lib/jsonld/override-validator';

/**
 * Page Registry — one row per website ROUTE, so every page (including the
 * hardcoded static pages that have no content document) has a home for its
 * Schema.org override. Powers the Schema Manager dashboard's "every page"
 * list (Phase 2) and feeds the web build's per-page JSON-LD composition for
 * static + listing routes.
 *
 * CMS-detail pages (blogs, news, …) keep editing schema on the document
 * itself — a registry row would never scale to hundreds of slugs. For those
 * the registry holds a single `cms-template` row that deep-links into the
 * collection.
 */

const KIND_OPTIONS: { label: string; value: string }[] = [
  { label: 'Static page', value: 'static' },
  { label: 'CMS listing page', value: 'cms-listing' },
  { label: 'CMS collection (template)', value: 'cms-template' },
];

const validatePath = (value: unknown): true | string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'Path is required.';
  }
  if (!value.startsWith('/')) {
    return 'Path must be a site-relative route starting with "/" (e.g. /pricing).';
  }
  if (value.includes('://') || value.startsWith('//')) {
    return 'Path must be site-relative — no protocol or host.';
  }
  return true;
};

export const PageRegistry: CollectionConfig = {
  slug: 'pageRegistry',
  labels: { singular: 'Page (Schema)', plural: 'Pages (Schema)' },
  admin: {
    useAsTitle: 'path',
    defaultColumns: ['path', 'title', 'kind', 'updatedAt'],
    group: 'SEO',
    description:
      'Every website route, including static pages. Add a Schema.org override here to compose it into that page’s JSON-LD at build time.',
  },
  // Public read: the web build/ISR fetches this anonymously to compose static
  // page schema. Writes are editor+ (Phase 3 adds the `seo` role).
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    {
      name: 'path',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: validatePath,
      admin: {
        description: 'Site-relative route, e.g. /pricing or /blogs. One row per route.',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Human label shown in the Schema Manager list.' },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'static',
      options: KIND_OPTIONS,
      admin: {
        description:
          'static = hardcoded page; cms-listing = a collection’s index page; cms-template = drill into the collection’s documents.',
      },
    },
    {
      name: 'backingCollection',
      type: 'text',
      admin: {
        description: 'For cms-listing / cms-template: the collection slug this route renders.',
        condition: (_data, siblingData) =>
          siblingData?.kind === 'cms-template' || siblingData?.kind === 'cms-listing',
      },
    },
    {
      name: 'additionalSchema',
      type: 'json',
      validate: validateOverrideForFieldOnCollection('pageRegistry') as JSONFieldValidation,
      admin: {
        description:
          'Raw Schema.org JSON-LD for this page (single object or array of objects, each with @context + an allow-listed @type). Validated and capped at 16 KB; composed per-@type into the page’s @graph at build time.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Optional internal notes (not rendered).' },
    },
  ],
};
