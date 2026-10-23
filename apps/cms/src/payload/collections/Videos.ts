import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload';
import { ValidationError } from 'payload';

import { isAdminOrEditor, publishedOrAuthenticated } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { contentUpdatedAtField } from '../fields/content-updated-at';
import { displayPublishedAtField } from '../fields/display-published-at';
import { publishedAtField } from '../fields/published-at';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { contentUpdatedAtHook } from '../hooks/content-updated-at';
import { displayPublishedAtAuditHook } from '../hooks/display-published-at-audit';
import { displayPublishedAtBackfillHook } from '../hooks/display-published-at-backfill';
import { firstPublishHook } from '../hooks/first-publish';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import {
  revalidateWebAfterDeleteHook,
  revalidateWebPublishAfterChangeHook,
} from '../hooks/revalidate-web-publish';
import { searchSyncAfterChangeHook, searchSyncAfterDeleteHook } from '../hooks/search-sync';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';
import { ROUTE_PREFIX } from '../lib/route-prefixes';

/** Plan 2 adds 'vimeo'. The enum value exists now so that is not an enum migration. */
export const SUPPORTED_PROVIDERS: readonly string[] = ['youtube'];

const SUMMARY_MAX = 320;
const DURATION_LABEL = /^\d{1,2}(:\d{2}){1,2}$/;

const readOnly = { update: () => false } as const;

export const enforceSupportedProviderHook: CollectionBeforeChangeHook = ({ data }) => {
  const provider = (data as { provider?: string }).provider;
  if (provider && !SUPPORTED_PROVIDERS.includes(provider)) {
    throw new ValidationError({
      errors: [{ path: 'provider', message: `Provider "${provider}" is not enabled yet.` }],
    });
  }
  return data;
};

/** Old videos keep their real date: publishedAt follows the upload date until an editor sets one. */
export const publishedAtFromSourceHook: CollectionBeforeChangeHook = ({ data, operation }) => {
  const source = (data as { source?: { publishedAt?: string } }).source;
  const current = (data as { publishedAt?: string | null }).publishedAt;
  if (operation === 'create' && !current && source?.publishedAt) {
    return { ...data, publishedAt: source.publishedAt };
  }
  return data;
};

/**
 * Editorial videos for /videos. Imported from YouTube by the hourly sync as
 * needs-review drafts (see `lib/videos`). The `source` group is owned by the
 * sync, everything else by editors; neither overwrites the other.
 */
export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Video', plural: 'Videos' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'format', 'syncState', '_status', 'publishedAt'],
    group: 'Content',
    components: {
      edit: docStatusBarEditConfig({ showStats: false, showPublishedAt: true, showPurge: true }),
    },
  },
  access: {
    read: publishedOrAuthenticated,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    contentTitleField,
    slugField({ source: 'title' }),
    {
      name: 'provider',
      type: 'select',
      required: true,
      defaultValue: 'youtube',
      options: [
        { label: 'YouTube', value: 'youtube' },
        { label: 'Vimeo', value: 'vimeo' },
      ],
      access: readOnly,
      admin: { position: 'sidebar' },
    },
    {
      name: 'externalId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: readOnly,
      admin: {
        position: 'sidebar',
        description: 'The video id on the host (the 11 characters in a YouTube link).',
      },
    },
    {
      name: 'format',
      type: 'select',
      options: [
        { label: 'Explainer', value: 'explainer' },
        { label: 'Product demo', value: 'demo' },
        { label: 'Talk or webinar', value: 'talk' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Required to publish. Drives the format tabs on /videos.',
      },
    },
    {
      name: 'topics',
      type: 'relationship',
      relationTo: 'videoTopics',
      hasMany: true,
      admin: {
        description: 'At least one is required to publish. Suggested from YouTube hashtags on import.',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      maxLength: SUMMARY_MAX,
      admin: {
        description: `Card text and meta description. Required to publish, up to ${SUMMARY_MAX} characters.`,
      },
    },
    {
      name: 'durationLabel',
      type: 'text',
      validate: (value: string | null | undefined) =>
        value == null || value === '' || DURATION_LABEL.test(value)
          ? true
          : 'Use m:ss or h:mm:ss, for example 1:41 or 1:02:10.',
      admin: {
        position: 'sidebar',
        description:
          'Length shown on cards. Filled automatically when the YouTube API key is set; type it by hand otherwise (1:41).',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Plays in the /videos hero. When none is featured, the newest video is.',
      },
    },
    {
      name: 'transcript',
      type: 'textarea',
      admin: { description: 'Optional. Shown on the watch page once Plan 2 ships.' },
    },
    {
      name: 'syncState',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Synced', value: 'synced' },
        { label: 'Needs review', value: 'needs-review' },
        { label: 'Missing on YouTube', value: 'missing' },
        { label: 'Manual', value: 'manual' },
      ],
      access: readOnly,
      admin: {
        position: 'sidebar',
        description:
          'Set by the YouTube sync. "Missing" means the video is gone or private on YouTube; it is not unpublished automatically.',
      },
    },
    {
      name: 'source',
      type: 'group',
      admin: { description: 'Copied from the host by the sync. Read only.' },
      fields: [
        { name: 'title', type: 'text', access: readOnly },
        { name: 'description', type: 'textarea', access: readOnly },
        { name: 'durationSeconds', type: 'number', access: readOnly },
        { name: 'publishedAt', type: 'date', access: readOnly },
        {
          name: 'tags',
          type: 'array',
          access: readOnly,
          fields: [{ name: 'value', type: 'text' }],
        },
        { name: 'privacyStatus', type: 'text', access: readOnly },
        { name: 'embeddable', type: 'checkbox', access: readOnly },
        { name: 'hasMaxres', type: 'checkbox', access: readOnly },
        { name: 'thumbnailUrl', type: 'text', access: readOnly },
        { name: 'contentHash', type: 'text', access: readOnly, admin: { hidden: true } },
        { name: 'fetchedAt', type: 'date', access: readOnly },
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
            clientProps: { pathPrefix: ROUTE_PREFIX.videos },
          },
        },
      },
    },
    publishedAtField,
    displayPublishedAtField,
    contentUpdatedAtField,
    ...seoSidebarFields({ pathPrefix: ROUTE_PREFIX.videos, descriptionSource: 'summary' }),
    ...seoFieldsForSidebar('videos'),
  ],
  hooks: {
    beforeChange: [
      enforceSupportedProviderHook,
      publishedAtFromSourceHook,
      contentUpdatedAtHook(),
      firstPublishHook(),
      displayPublishedAtBackfillHook,
    ],
    afterChange: [
      slugChangeRedirectHook('videos'),
      displayPublishedAtAuditHook('videos'),
      searchSyncAfterChangeHook('videos'),
      webhooksPublishAfterChangeHook('videos'),
      indexNowPublishAfterChangeHook('videos'),
      revalidateWebPublishAfterChangeHook('videos'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('videos'), revalidateWebAfterDeleteHook('videos')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
