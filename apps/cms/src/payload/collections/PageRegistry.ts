import type { CollectionConfig, JSONFieldValidation } from 'payload';

import { isAdmin, isAdminEditorOrSeo, isAdminOrSeoFieldLevel } from '../access';
import { pageLiveSchemaEndpoint } from '../endpoints/page-live-schema';
import { filterToMergeable, validatePartialOverride } from '../lib/jsonld/filter-override';
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
  // build/ISR fetches it anonymously). Create is disabled in the UI/API — rows
  // come ONLY from scripts/seed-page-registry.ts (which bypasses access via
  // overrideAccess); a hand-made row for a path that isn't a real route does
  // nothing. Update is admin/editor/seo (edit the override + notes). Delete is
  // admin-only (clean up a row when a page is removed from the site).
  access: {
    read: () => true,
    create: () => false,
    update: isAdminEditorOrSeo,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [revalidatePageRegistryHook],
    afterDelete: [revalidatePageRegistryDeleteHook],
  },
  endpoints: [pageLiveSchemaEndpoint],
  fields: [
    // Identity/classification fields — system-managed by the seed. These are
    // LOCKED: `admin.readOnly` makes them read-only in the admin UI, and
    // `access.update: () => false` enforces it server-side too (a stray API
    // update can't change them). Editing a path would silently break the
    // route→override link; changing kind can break revalidation. The seed sets
    // them via overrideAccess, which bypasses both. To change one, edit
    // scripts/seed-page-registry.ts and re-run the seed.
    {
      name: 'path',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: { update: () => false },
      validate: validatePath,
      admin: {
        readOnly: true,
        description: 'Site-relative route, e.g. /pricing or /blogs. Seed-managed (read-only).',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      access: { update: () => false },
      admin: {
        readOnly: true,
        description: 'Human label shown in the Schema Manager list. Seed-managed (read-only).',
      },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'static',
      options: KIND_OPTIONS,
      access: { update: () => false },
      admin: {
        readOnly: true,
        description:
          'static = hardcoded page; cms-listing = a collection’s index page; cms-template = drill into the collection’s documents. Seed-managed (read-only).',
      },
    },
    {
      name: 'backingCollection',
      type: 'text',
      access: { update: () => false },
      admin: {
        readOnly: true,
        description: 'For cms-listing / cms-template: the collection slug this route renders. Seed-managed (read-only).',
        condition: (_data, siblingData) =>
          siblingData?.kind === 'cms-template' || siblingData?.kind === 'cms-listing',
      },
    },
    {
      // Right-rail reference: allow/block lists + override dates (collapsed).
      name: 'schemaSidebarInfo',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field:
            './payload/admin/components/SchemaManager/SchemaSidebarInfo.tsx#SchemaSidebarInfo',
        },
      },
    },
    {
      // Right-rail read-only viewer of the page's CURRENT live JSON-LD, block-wise.
      name: 'currentSchemaView',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field:
            './payload/admin/components/SchemaManager/CurrentSchemaView.tsx#CurrentSchemaView',
        },
      },
    },
    {
      // Right-rail allow-list + site-wide blocklist (collapsed), below the viewer.
      name: 'schemaAllowBlock',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: './payload/admin/components/SchemaManager/SchemaAllowBlock.tsx#SchemaAllowBlock',
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
      validate: validatePartialOverride as JSONFieldValidation,
      hooks: {
        // Keep-valid / drop-invalid: store only the merge-able blocks (a paste
        // mixing a valid Article with a conflicting WebSite saves just Article).
        beforeChange: [({ value }) => filterToMergeable(value).kept],
      },
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
