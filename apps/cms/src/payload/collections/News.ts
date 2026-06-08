import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { ROUTE_PREFIX } from '../lib/route-prefixes';
import { mediaUploadField } from '../fields/media-upload';
import { schemaAddonsField } from '../fields/schema-addons';
import { schemaOverrideAuditHook } from '../hooks/schema-override-audit';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { bodyStatsHook } from '../hooks/body-stats';
import { normalizeLexicalHook } from '../hooks/normalize-lexical';
import { firstPublishBeforeValidateHook } from '../hooks/first-publish';
import {
  searchSyncAfterChangeHook,
  searchSyncAfterDeleteHook,
} from '../hooks/search-sync';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';
import { normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'News article', plural: 'News' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'newsCategories', 'publicationDate', '_status', 'updatedAt'],
    group: 'Content',
    components: {
      edit: docStatusBarEditConfig({ showStats: true, showPublishedAt: false }),
    },
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    contentTitleField,
    slugField({ source: 'title' }),
    { name: 'abstract', type: 'textarea' },
    mediaUploadField({ name: 'heroImage', folderHint: 'web/news' }),
    {
      name: 'publisher',
      type: 'text',
      admin: {
        description:
          'Outlet name shown on the listing card meta strip and detail hero (e.g. "Dark Reading").',
      },
    },
    mediaUploadField({
      name: 'publisherLogo',
      folderHint: 'web/news',
      description:
        'Outlet logo (~400×120, transparent PNG/SVG). Rendered large on the listing card and as the hero card on the detail page.',
    }),
    {
      name: 'pressType',
      type: 'select',
      defaultValue: 'press-release',
      admin: {
        description: 'Pill shown on cards and the detail meta strip.',
      },
      options: [
        { label: 'Press Release', value: 'press-release' },
        { label: 'News', value: 'news' },
        { label: 'Announcement', value: 'announcement' },
        { label: 'Feature', value: 'feature' },
      ],
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        description: 'Dateline city, e.g. "Lewes, DE" — rendered before the body opener.',
      },
    },
    {
      name: 'region',
      type: 'select',
      options: [
        { label: 'Asia Pacific', value: 'asia-pacific' },
        { label: 'Europe & Middle East', value: 'europe-middle-east' },
        { label: 'North America', value: 'usa-north-america' },
      ],
      admin: {
        description:
          'Region this story belongs to. Powers the region filter on the /news listing page.',
      },
    },
    { name: 'body', type: 'richText' },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
      filterOptions: {
        acceptingNewBylines: { not_equals: false },
      },
      admin: {
        components: {
          Cell: {
            path: '@/payload/admin/components/RelationshipCell.tsx#RelationshipCell',
            clientProps: { collectionSlug: 'authors' },
          },
        },
      },
    },
    {
      name: 'newsCategories',
      type: 'relationship',
      relationTo: 'newsCategories',
      hasMany: true,
      admin: {
        components: {
          Cell: {
            path: '@/payload/admin/components/RelationshipCell.tsx#RelationshipCell',
            clientProps: { collectionSlug: 'newsCategories' },
          },
        },
      },
    },
    {
      name: 'externalUrl',
      type: 'text',
      admin: {
        description: 'Optional. For press pickups / coverage on external outlets.',
      },
      hooks: { beforeValidate: [normalizeOptionalUrlHook] },
      validate: validateOptionalUrl,
    },
    {
      name: 'permalink',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/PermalinkField.tsx#PermalinkField',
            clientProps: { pathPrefix: ROUTE_PREFIX.news },
          },
        },
      },
    },
    schemaAddonsField,
    ...seoSidebarFields({ pathPrefix: ROUTE_PREFIX.news, descriptionSource: 'abstract' }),
    {
      name: 'publicationDate',
      type: 'date',
      required: true,
      // Pre-populate with `now` at creation time so editors see a real
      // value in the picker immediately and the client-side `required`
      // check passes on the first publish click. Backdate / forward-date
      // by editing the picker — the value is the canonical publish
      // moment, used by JSON-LD (`datePublished`) and the news sitemap.
      // `firstPublishBeforeValidateHook` (see `hooks.beforeValidate`)
      // remains as a server-side safety net for legacy drafts created
      // before this default landed, or for any path that clears the
      // value between draft and publish.
      defaultValue: () => new Date().toISOString(),
      admin: {
        description:
          'Defaults to the current moment on creation. Backdate or schedule by editing the picker.',
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
    },
    {
      name: 'relatedNews',
      type: 'relationship',
      relationTo: 'news',
      hasMany: true,
    },
    {
      // Data-only — surfaced via the DocStatusBar in the top status bar.
      // Hidden here so the form doesn't double-render.
      name: 'readingMinutes',
      type: 'number',
      access: { update: () => false },
      admin: { readOnly: true, hidden: true },
    },
    {
      name: 'wordCount',
      type: 'number',
      access: { update: () => false },
      admin: { readOnly: true, hidden: true },
    },
    ...seoFieldsForSidebar('news'),
    {
      // Editorial flag mirroring Blogs. When set, the news item is shown in
      // the listing hero's featured card; the web loader falls back to the
      // latest published item when nothing is flagged.
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    // News uses `publicationDate` as its canonical first-publish
    // stamp (no separate `publishedAt`). The field is `required:true`
    // and editor-facing, so the stamp must run in `beforeValidate`
    // (not `beforeChange`) — otherwise the required-check fires
    // first and the publish click fails before the auto-default lands.
    // Honours editor backdates and explicit picker edits.
    beforeValidate: [firstPublishBeforeValidateHook({ field: 'publicationDate' })],
    beforeChange: [
      normalizeLexicalHook(),
      bodyStatsHook({
        fields: { readingMinutes: 'readingMinutes', wordCount: 'wordCount' },
      }),
    ],
    afterChange: [
      slugChangeRedirectHook('news'),
      schemaOverrideAuditHook('news'),
      searchSyncAfterChangeHook('news'),
      webhooksPublishAfterChangeHook('news'),
      indexNowPublishAfterChangeHook('news'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('news')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
