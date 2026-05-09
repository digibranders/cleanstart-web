import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { pageBuilderBlocks } from '../blocks';
import { publishedAtField } from '../fields/published-at';
import { schemaAddonsField } from '../fields/schema-addons';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { firstPublishHook } from '../hooks/first-publish';
import { schemaOverrideAuditHook } from '../hooks/schema-override-audit';
import { pagesPathBuilderHook } from '../hooks/pages-path-builder';
import {
  searchSyncAfterChangeHook,
  searchSyncAfterDeleteHook,
} from '../hooks/search-sync';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';

/**
 * Page-builder host collection. The Pages tree is the only content
 * collection where two siblings can share a slug — `pricing` under
 * `/solutions/` and `pricing` under `/customers/` both resolve to
 * different URLs. Slug uniqueness is therefore enforced as a composite
 * `(slug, parent)` index plus a server-side `validate` rather than a
 * column-level UNIQUE constraint.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'path', 'parent', '_status', 'publishedAt', 'updatedAt'],
    group: 'Content',
    components: {
      edit: docStatusBarEditConfig({ showStats: false, showPublishedAt: true }),
    },
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  indexes: [
    {
      fields: ['slug', 'parent'],
      unique: true,
    },
  ],
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ source: 'title', composite: true }),
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'pages',
      admin: {
        description: 'Optional parent page. Builds nested URLs (e.g. /solutions/fips).',
      },
      validate: async (
        value: unknown,
        {
          id,
          req,
        }: {
          id?: string | number | undefined;
          req?: { payload?: import('payload').Payload };
        },
      ): Promise<true | string> => {
        // Cycle detection: walking parent chain, the current page must not
        // appear as one of its own ancestors (and a page can't be its own
        // parent).
        if (value == null || id == null) return true;
        if (value === id) return 'A page cannot be its own parent.';
        const payload = req?.payload;
        if (!payload) return true;
        const seen = new Set<string | number>([id]);
        let cursor: string | number | null = value as string | number;
        while (cursor != null) {
          if (seen.has(cursor)) {
            return 'Parent chain creates a cycle.';
          }
          seen.add(cursor);
          // eslint-disable-next-line no-await-in-loop -- chain depth is bounded
          const node = (await payload.findByID({
            collection: 'pages',
            id: cursor,
            depth: 0,
            overrideAccess: true,
          })) as { parent?: string | number | { id?: string | number } | null } | null;
          const next = node?.parent ?? null;
          cursor =
            typeof next === 'object' && next !== null
              ? (next as { id?: string | number }).id ?? null
              : (next as string | number | null);
        }
        return true;
      },
    },
    {
      // The compact PermalinkField (sidebar UI below) renders the live URL
      // built from this value. Hidden here so the form doesn't double-render
      // a full-width read-only text input next to the chip.
      name: 'path',
      type: 'text',
      index: true,
      access: { update: () => false },
      admin: { readOnly: true, hidden: true },
    },
    {
      // Computed by `pagesPathBuilderHook` on every save. The dispatcher
      // emits a BreadcrumbList JSON-LD blob from this; the public site
      // can render the same trail without a parent-chain fetch.
      name: 'breadcrumb',
      type: 'array',
      access: { update: () => false },
      admin: { readOnly: true, hidden: true },
      fields: [
        { name: 'path', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
      ],
    },
    {
      name: 'permalink',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/PermalinkField.tsx#PermalinkField',
            // Pages compute a full nested path (e.g. `/solutions/pricing`)
            // on save — surface it as the link source with no prefix.
            clientProps: { pathPrefix: '', sourceField: 'path' },
          },
        },
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: pageBuilderBlocks,
      admin: {
        description:
          'Compose the page from typed blocks. Section is a layout primitive — every other block is a content unit.',
      },
    },
    {
      name: 'pageLayout',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Narrow', value: 'narrow' },
        { label: 'Full-bleed', value: 'full-bleed' },
      ],
      admin: {
        description: 'Container width and chrome.',
        position: 'sidebar',
      },
    },
    {
      name: 'schemaType',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: 'Auto (from URL)', value: 'auto' },
        { label: 'WebPage', value: 'WebPage' },
        { label: 'AboutPage', value: 'AboutPage' },
        { label: 'ContactPage', value: 'ContactPage' },
        { label: 'CollectionPage (index / archive)', value: 'CollectionPage' },
      ],
      admin: {
        description:
          'Schema.org @type for this page. Auto picks WebPage / AboutPage / ContactPage by URL; override here for /pricing → CollectionPage, /contact-eu → ContactPage, etc.',
        position: 'sidebar',
      },
    },
    schemaAddonsField,
    publishedAtField,
    ...seoSidebarFields({ pathPrefix: '', descriptionSource: 'abstract', urlSource: 'path' }),
    ...seoFieldsForSidebar('pages'),
  ],
  hooks: {
    beforeChange: [firstPublishHook(), pagesPathBuilderHook],
    afterChange: [
      slugChangeRedirectHook('pages'),
      schemaOverrideAuditHook('pages'),
      searchSyncAfterChangeHook('pages'),
      webhooksPublishAfterChangeHook('pages'),
      indexNowPublishAfterChangeHook('pages'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('pages')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
