import type { CollectionConfig, JSONFieldValidation } from 'payload';

import { isAdmin, isAdminEditorOrSeo, isAdminOrSeoFieldLevel } from '../access';
import { pageLiveSchemaEndpoint } from '../endpoints/page-live-schema';
import { filterToMergeable, validatePartialOverride } from '../lib/jsonld/filter-override';
import { revalidatePageRegistryHook, revalidatePageRegistryDeleteHook } from '../hooks/revalidate-page-registry';
import { recordSchemaHistoryHook } from '../hooks/record-schema-history';

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

// Functional WebPage @type for STATIC/LISTING routes. Auto-emitted into the
// page's @graph by the web build (apps/web reads this field at build time).
// 'none' (the default) emits no page-level WebPage node — backward compatible.
const WEB_PAGE_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: 'None (no WebPage node)', value: 'none' },
  { label: 'WebPage', value: 'WebPage' },
  { label: 'AboutPage', value: 'AboutPage' },
  { label: 'ContactPage', value: 'ContactPage' },
  { label: 'CollectionPage', value: 'CollectionPage' },
  { label: 'ProfilePage', value: 'ProfilePage' },
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
  // List reads in live mega-menu order (seeded `order`), not alphabetically.
  defaultSort: 'order',
  admin: {
    useAsTitle: 'path',
    // Search matches both the path/slug AND the title (so "home" finds the Home row).
    listSearchableFields: ['path', 'title'],
    defaultColumns: ['path', 'title', 'kind', 'webPageType', 'updatedAt'],
    group: 'SEO',
    description:
      'Every website route, including static pages. Add a Schema.org override here to compose it into that page’s JSON-LD at build time.',
    components: {
      // Quick filter pills (Kind + Override status) above the list table.
      beforeListTable: ['./payload/admin/components/SchemaManager/PageSchemaFilters.tsx#PageSchemaFilters'],
    },
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
    beforeChange: [recordSchemaHistoryHook],
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
      // Mega-menu display order (seed-managed). Hidden; drives the list sort.
      name: 'order',
      type: 'number',
      access: { update: () => false },
      admin: { hidden: true },
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
      // Functional WebPage @type for this route — editor-writable. The web
      // build auto-emits the matching node (webPageSchema) at build time.
      name: 'webPageType',
      type: 'select',
      defaultValue: 'none',
      options: WEB_PAGE_TYPE_OPTIONS,
      admin: {
        description:
          'Declares what kind of page this is. The site auto-emits the matching WebPage node (AboutPage for an about page, CollectionPage for a listing, …) into the page’s JSON-LD at build time. “None” emits no WebPage node.',
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
      // Right-rail guided block-builder: pick a @type → insert a pre-filled,
      // validated starter block into the override (no hand-written JSON-LD).
      name: 'schemaBuilderView',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: './payload/admin/components/SchemaManager/SchemaBlockBuilder.tsx#SchemaBlockBuilder',
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
      // Right-rail per-@type version history (collapsed), below allow/block.
      name: 'schemaHistoryView',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: './payload/admin/components/SchemaManager/SchemaHistory.tsx#SchemaHistory',
        },
      },
    },
    {
      // Per-@type override history, maintained by recordSchemaHistoryHook.
      // Hidden + system-managed; read restricted (carries editor emails).
      name: 'schemaHistory',
      type: 'json',
      access: {
        read: ({ req: { user } }) => Boolean(user),
        update: () => false,
        create: () => false,
      },
      admin: { hidden: true },
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
