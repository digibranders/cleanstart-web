import type { CollectionConfig } from 'payload';
import { purgePageUiField } from '../fields/purge-page-ui';

import { isAdminOrEditor, publishedOrAuthenticated } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { mediaUploadField } from '../fields/media-upload';
import { publishedAtField } from '../fields/published-at';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { firstPublishHook } from '../hooks/first-publish';
import {
  revalidateWebAfterDeleteHook,
  revalidateWebPublishAfterChangeHook,
} from '../hooks/revalidate-web-publish';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';

/**
 * Case Studies — a listing-only, download-first collection.
 *
 * Each case study is a downloadable PDF (stored in R2) surfaced on the
 * `/case-studies` listing page. There is no detail route, so this collection
 * deliberately omits the slug-change-redirect, search-sync, IndexNow, SEO, and
 * rich-text machinery the article collections carry — none of it has a target
 * URL to point at. The `webhooksPublish` hook stays because it only notifies
 * editors of a publish transition and degrades gracefully when no live URL
 * exists.
 *
 * The `slug` field is kept as a stable, human-readable identifier (and to leave
 * the door open for a future detail page) but is not wired to any route today.
 */
export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  labels: { singular: 'Case Study', plural: 'Case Studies' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'company', 'industry', '_status', 'updatedAt'],
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
      name: 'industry',
      type: 'select',
      options: [
        { label: 'Healthcare', value: 'healthcare' },
        { label: 'Telecom', value: 'telecom' },
        { label: 'Finance', value: 'finance' },
        { label: 'Technology', value: 'technology' },
        { label: 'Manufacturing', value: 'manufacturing' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description:
          'Legacy enum — superseded by the Industry relationship below. Kept during the taxonomy transition; removed once apps/web reads the relationship.',
      },
    },
    {
      name: 'industryRef',
      type: 'relationship',
      relationTo: 'industries',
      admin: {
        description:
          'Industry taxonomy reference. Seeded/backfilled from the legacy `industry` enum; editors manage the list under Taxonomies → Industries.',
      },
    },
    {
      name: 'company',
      type: 'text',
      required: true,
      admin: {
        description: 'Customer / company name shown above the card title.',
      },
    },
    mediaUploadField({
      name: 'companyLogo',
      required: true,
      folderHint: 'web/case-study',
      description: 'Company wordmark shown beside the company name.',
    }),
    mediaUploadField({
      name: 'coverImage',
      folderHint: 'web/case-study',
      description: 'Optional card thumbnail image.',
    }),
    { name: 'summary', type: 'textarea', required: true },
    mediaUploadField({
      name: 'asset',
      required: true,
      folderHint: 'web/case-study',
      description: 'Downloadable case-study PDF. Routed to web/case-study/ in R2.',
      accept: ['application/pdf'],
    }),
    publishedAtField,
  ],
  hooks: {
    beforeChange: [firstPublishHook()],
    afterChange: [
      webhooksPublishAfterChangeHook('case-studies'),
      revalidateWebPublishAfterChangeHook('case-studies'),
    ],
    afterDelete: [revalidateWebAfterDeleteHook('case-studies')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
