import type { CollectionConfig } from 'payload';
import { purgePageUiField } from '../fields/purge-page-ui';

import { isAdminOrEditor, publishedOrAuthenticated } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { resourceDownloadEndpoint, resourceTokenEndpoint } from '../endpoints/resources-download';
import { displayPublishedAtField } from '../fields/display-published-at';
import { mediaUploadField } from '../fields/media-upload';
import { publishedAtField } from '../fields/published-at';
import { schemaAddonsField } from '../fields/schema-addons';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { displayPublishedAtAuditHook } from '../hooks/display-published-at-audit';
import { displayPublishedAtBackfillHook } from '../hooks/display-published-at-backfill';
import { firstPublishHook } from '../hooks/first-publish';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import { normalizeLexicalHook } from '../hooks/normalize-lexical';
import {
  revalidateWebAfterDeleteHook,
  revalidateWebPublishAfterChangeHook,
} from '../hooks/revalidate-web-publish';
import { schemaOverrideAuditHook } from '../hooks/schema-override-audit';
import { searchSyncAfterChangeHook, searchSyncAfterDeleteHook } from '../hooks/search-sync';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';
import { ROUTE_PREFIX } from '../lib/route-prefixes';

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
    read: publishedOrAuthenticated,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    purgePageUiField,
    contentTitleField,
    slugField({ source: 'title' }),
    {
      name: 'type',
      type: 'select',
      admin: {
        description:
          'Legacy enum — superseded by the Resource type relationship below. Kept during the taxonomy transition; removed once apps/web reads the relationship.',
      },
      options: [
        { label: 'Whitepaper', value: 'whitepaper' },
        { label: 'Ebook', value: 'ebook' },
        { label: 'Datasheet', value: 'datasheet' },
        { label: 'Architecture Insights', value: 'architecture-insights' },
        { label: 'Report', value: 'report' },
      ],
    },
    {
      name: 'typeRef',
      type: 'relationship',
      relationTo: 'resourceTypes',
      admin: {
        description:
          'Resource type taxonomy reference. Seeded/backfilled from the legacy `type` enum; editors manage the list under Taxonomies → Resource types.',
      },
    },
    { name: 'summary', type: 'textarea' },
    mediaUploadField({
      name: 'heroImage',
      folderHint: 'web/resource',
      description:
        'Optional cover shown on the resource detail page. When empty, the detail page falls back to the branded type poster (whitepaper / ebook / etc.). Listing cards always use the type poster.',
    }),
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
      // Restrict the picker to the dedicated gated-download form so editors
      // can't accidentally attach an unrelated lead form (book-a-demo,
      // contact, …) as a download gate.
      filterOptions: () => ({ slug: { equals: 'content-gated' } }),
      admin: {
        description:
          'Form the visitor fills to unlock the download. Required when gated — the validator blocks save until set.',
        condition: (_data, sibling) => sibling?.gated === true,
        components: {
          // Custom label that appends the red `*` only when `gated` is
          // checked. Required-asterisk is normally driven by
          // schema-level `required: true`, but we can't set that here:
          // Payload runs required-validation regardless of
          // `admin.condition`, which would block saving any non-gated
          // resource. The validate function below is the source of
          // truth — this component is just the visual cue.
          Label: '@/payload/admin/components/GateFormLabel.tsx#GateFormLabel',
        },
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
    displayPublishedAtField,
    ...seoSidebarFields({ pathPrefix: ROUTE_PREFIX.resources, descriptionSource: 'summary' }),
    {
      name: 'downloadCount',
      type: 'number',
      defaultValue: 0,
      access: { update: () => false },
      admin: {
        readOnly: true,
        description: 'Automatically incremented each time a visitor downloads this resource.',
        position: 'sidebar',
        condition: (_data, sibling) => sibling?.gated === true,
      },
    },
    ...seoFieldsForSidebar('resources'),
  ],
  hooks: {
    beforeChange: [normalizeLexicalHook(), firstPublishHook(), displayPublishedAtBackfillHook],
    afterChange: [
      slugChangeRedirectHook('resources'),
      schemaOverrideAuditHook('resources'),
      displayPublishedAtAuditHook('resources'),
      searchSyncAfterChangeHook('resources'),
      webhooksPublishAfterChangeHook('resources'),
      indexNowPublishAfterChangeHook('resources'),
      revalidateWebPublishAfterChangeHook('resources'),
    ],
    afterDelete: [
      searchSyncAfterDeleteHook('resources'),
      revalidateWebAfterDeleteHook('resources'),
    ],
  },
  endpoints: [resourceDownloadEndpoint, resourceTokenEndpoint],
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
