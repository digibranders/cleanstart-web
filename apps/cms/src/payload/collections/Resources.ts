import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { ROUTE_PREFIX } from '../lib/route-prefixes';
import { mediaUploadField } from '../fields/media-upload';
import { publishedAtField } from '../fields/published-at';
import { schemaAddonsField } from '../fields/schema-addons';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { firstPublishHook } from '../hooks/first-publish';
import { schemaOverrideAuditHook } from '../hooks/schema-override-audit';
import {
  searchSyncAfterChangeHook,
  searchSyncAfterDeleteHook,
} from '../hooks/search-sync';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';

export const Resources: CollectionConfig = {
  slug: 'resources',
  labels: { singular: 'Resource', plural: 'Resources' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'gated', 'accessLevel', '_status', 'updatedAt'],
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
  fields: [
    contentTitleField,
    slugField({ source: 'title' }),
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Whitepaper', value: 'whitepaper' },
        { label: 'Ebook', value: 'ebook' },
        { label: 'Datasheet', value: 'datasheet' },
        { label: 'Architecture Insights', value: 'architecture-insights' },
        { label: 'Report', value: 'report' },
      ],
    },
    { name: 'summary', type: 'textarea' },
    mediaUploadField({
      name: 'asset',
      folderHint: 'web/resource',
      description: 'PDF or ZIP downloadable. Routed to web/resource/.',
      accept: ['application/pdf', 'application/zip', 'application/x-zip-compressed'],
    }),
    { name: 'body', type: 'richText' },
    {
      name: 'gated',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'When enabled, the asset download requires a form submission. Sets accessLevel to lead-gated by default.',
      },
    },
    {
      name: 'gateForm',
      type: 'relationship',
      relationTo: 'forms',
      admin: {
        description: 'Form the visitor fills to unlock the download. Required when gated.',
        condition: (_data, sibling) => sibling?.gated === true,
      },
      validate: (
        value: unknown,
        { siblingData }: { siblingData?: { gated?: boolean } },
      ): true | string => {
        if (siblingData?.gated !== true) return true;
        if (value == null) {
          return 'Gated resources need a gate form so visitors have something to fill.';
        }
        return true;
      },
    },
    {
      name: 'accessLevel',
      type: 'select',
      defaultValue: 'public',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Lead-gated (form unlocks)', value: 'lead-gated' },
        { label: 'Customer-only', value: 'customer-only' },
      ],
      admin: {
        condition: (_data, sibling) => sibling?.gated === true,
      },
    },
    {
      name: 'ctaButtonText',
      type: 'text',
      admin: {
        description:
          'CTA copy on the gated download / view button. Empty falls back to a sensible default by `type` (Whitepapers → "Download whitepaper", Reports → "Read the report", etc).',
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
            clientProps: { pathPrefix: ROUTE_PREFIX.resources },
          },
        },
      },
    },
    schemaAddonsField,
    publishedAtField,
    ...seoSidebarFields({ pathPrefix: ROUTE_PREFIX.resources, descriptionSource: 'summary' }),
    {
      name: 'downloadCount',
      type: 'number',
      defaultValue: 0,
      access: { update: () => false },
      admin: {
        readOnly: true,
        description:
          'Incremented by the resource-download endpoint when added (Phase F). Always 0 today.',
        position: 'sidebar',
        condition: (_data, sibling) => sibling?.gated === true,
      },
    },
    ...seoFieldsForSidebar('resources'),
  ],
  hooks: {
    beforeChange: [firstPublishHook()],
    afterChange: [
      slugChangeRedirectHook('resources'),
      schemaOverrideAuditHook('resources'),
      searchSyncAfterChangeHook('resources'),
      webhooksPublishAfterChangeHook('resources'),
      indexNowPublishAfterChangeHook('resources'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('resources')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
