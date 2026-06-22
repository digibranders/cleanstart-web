import type { CollectionConfig, JSONFieldValidation } from 'payload';

import { isAdmin, isAdminEditorOrSeo, isAdminOrSeoFieldLevel } from '../access';
import { pageLiveSchemaEndpoint } from '../endpoints/page-live-schema';
import { validateOverrideForFieldOnCollection } from '../lib/jsonld/override-validator';
import { revalidatePageRegistryHook, revalidatePageRegistryDeleteHook } from '../hooks/revalidate-page-registry';

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
  // The registry is a SEED-MANAGED catalog of real routes. Public read (the web
  // build/ISR fetches it anonymously). Create/delete are admin-only — rows come
  // from scripts/seed-page-registry.ts (a new row for a path that isn't a real
  // route does nothing), and the seed bypasses access via overrideAccess.
  // Update stays admin/editor/seo so editors can edit the override + notes, but
  // the identity/classification fields (path/title/kind/backingCollection) are
  // locked on update at the field level below.
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdminEditorOrSeo,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [revalidatePageRegistryHook],
    afterDelete: [revalidatePageRegistryDeleteHook],
  },
  endpoints: [pageLiveSchemaEndpoint],
  fields: [
    // Identity/classification fields — settable on create (admin) and by the
    // seed, but LOCKED on update: changing a row's path silently breaks the
    // route→override link, and changing kind can break revalidation. Editors
    // only touch the override + notes. `access.update: () => false` enforces
    // this server-side and renders them read-only in the edit view; the seed
    // bypasses it via overrideAccess.
    {
      name: 'path',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: { update: () => false },
      validate: validatePath,
      admin: {
        description: 'Site-relative route, e.g. /pricing or /blogs. Locked after creation.',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      access: { update: () => false },
      admin: { description: 'Human label shown in the Schema Manager list. Locked after creation.' },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'static',
      options: KIND_OPTIONS,
      access: { update: () => false },
      admin: {
        description:
          'static = hardcoded page; cms-listing = a collection’s index page; cms-template = drill into the collection’s documents. Locked after creation.',
      },
    },
    {
      name: 'backingCollection',
      type: 'text',
      access: { update: () => false },
      admin: {
        description: 'For cms-listing / cms-template: the collection slug this route renders. Locked after creation.',
        condition: (_data, siblingData) =>
          siblingData?.kind === 'cms-template' || siblingData?.kind === 'cms-listing',
      },
    },
    {
      // Read-only viewer of the page's CURRENT live JSON-LD, block-wise.
      name: 'currentSchemaView',
      type: 'ui',
      admin: {
        components: {
          Field:
            './payload/admin/components/SchemaManager/CurrentSchemaView.tsx#CurrentSchemaView',
        },
      },
    },
    {
      name: 'additionalSchema',
      type: 'json',
      access: {
        // Privileged raw paste: admin or the dedicated seo operator. Read is
        // public (collection default) so the anonymous web build receives it.
        update: isAdminOrSeoFieldLevel,
        create: isAdminOrSeoFieldLevel,
      },
      validate: validateOverrideForFieldOnCollection('pageRegistry') as JSONFieldValidation,
      admin: {
        description:
          'Raw Schema.org JSON-LD for this page (single object or array of objects, each with @context + an allow-listed @type). Validated and capped at 16 KB; composed per-@type into the page’s @graph at build time.',
        components: {
          // Custom editor: paste OR upload .txt/.json + live validation + @type
          // preview. Overrides the default json CodeField (wire-custom-fields).
          Field:
            './payload/admin/components/SchemaManager/SchemaOverrideField.tsx#SchemaOverrideField',
        },
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Optional internal notes (not rendered).' },
    },
  ],
};
