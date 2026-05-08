import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { mediaUploadField } from '../fields/media-upload';
import { schemaAddonsField } from '../fields/schema-addons';
import { schemaOverrideAuditHook } from '../hooks/schema-override-audit';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { bodyStatsHook } from '../hooks/body-stats';
import {
  searchSyncAfterChangeHook,
  searchSyncAfterDeleteHook,
} from '../hooks/search-sync';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';
import { validateOptionalUrl } from '../lib/url-shape';

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'News article', plural: 'News' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'newsCategories', 'publicationDate', '_status', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ source: 'title' }),
    { name: 'abstract', type: 'textarea' },
    mediaUploadField({ name: 'heroImage', folderHint: 'web/news' }),
    { name: 'body', type: 'richText' },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
      filterOptions: {
        acceptingNewBylines: { not_equals: false },
      },
    },
    {
      name: 'newsCategories',
      type: 'relationship',
      relationTo: 'newsCategories',
      hasMany: true,
    },
    {
      name: 'externalUrl',
      type: 'text',
      admin: {
        description: 'Optional. For press pickups / coverage on external outlets.',
      },
      validate: validateOptionalUrl,
    },
    {
      name: 'bodyStats',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/payload/admin/components/BodyStatsField.tsx#BodyStatsField',
        },
      },
    },
    {
      name: 'permalink',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/PermalinkField.tsx#PermalinkField',
            clientProps: { pathPrefix: '/news' },
          },
        },
      },
    },
    schemaAddonsField,
    ...seoSidebarFields({ pathPrefix: '/news', descriptionSource: 'abstract' }),
    {
      name: 'publicationDate',
      type: 'date',
      required: true,
      admin: {
        description: 'Defaults to now on first publish.',
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
      // Data-only — surfaced via the `bodyStats` pill at the top of the
      // sidebar. Hidden here so the form doesn't double-render.
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
  ],
  hooks: {
    beforeChange: [
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
