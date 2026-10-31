import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionConfig, Field, TextField } from 'payload';
import { ValidationError } from 'payload';

import { isAdminOrEditor, publishedOrAuthenticated } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { contentUpdatedAtField } from '../fields/content-updated-at';
import { displayPublishedAtField } from '../fields/display-published-at';
import { publishedAtField } from '../fields/published-at';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { contentUpdatedAtHook } from '../hooks/content-updated-at';
import { displayPublishedAtAuditHook } from '../hooks/display-published-at-audit';
import { displayPublishedAtBackfillHook } from '../hooks/display-published-at-backfill';
import { firstPublishHook } from '../hooks/first-publish';
import {
  revalidateWebAfterDeleteHook,
  revalidateWebPublishAfterChangeHook,
} from '../hooks/revalidate-web-publish';

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
 * Only one video plays in the /videos hero. Publishing a featured video clears the flag on the
 * others, so an editor never has to untick the old one by hand. A draft is ignored: it is not live,
 * so it must not take the hero away from the video that is.
 */
export const singleFeaturedHook: CollectionAfterChangeHook = async ({ doc, req, context }) => {
  const current = doc as { id: number | string; featured?: boolean | null; _status?: string };
  if (context?.singleFeatured || current.featured !== true || current._status !== 'published') return doc;
  const others = await req.payload.find({
    collection: 'videos',
    where: { and: [{ featured: { equals: true } }, { id: { not_equals: current.id } }] },
    limit: 100,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  });
  for (const other of others.docs) {
    await req.payload.update({
      collection: 'videos',
      id: other.id,
      data: { featured: false },
      overrideAccess: true,
      depth: 0,
      context: { singleFeatured: true },
      req,
    });
  }
  return doc;
};

/** The slug has no public meaning (videos play inline), so it is generated from the title and not shown. */
const hiddenSlugField = (): Field => {
  const field = slugField({ source: 'title' }) as TextField;
  const { components: _components, position: _position, description: _description, ...admin } = field.admin ?? {};
  return { ...field, admin: { ...admin, hidden: true } };
};

/**
 * Editorial videos for /videos. Imported from YouTube by the hourly sync as
 * needs-review drafts (see `lib/videos`). The `source` group is owned by the
 * sync, everything else by editors; neither overwrites the other. Videos play
 * inline on the listing, so there is no per-video page, URL or SEO block here.
 */
export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Video', plural: 'Videos' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['thumb', 'title', 'state', 'format', 'topics', 'length'],
    description:
      'Videos shown on /videos. New YouTube uploads arrive as drafts marked "Needs review": choose a category and topics, write the summary, then publish.',
    group: 'Content',
    components: {
      edit: docStatusBarEditConfig({ showStats: false, showPublishedAt: true, showPurge: true }),
    },
  },
  defaultSort: '-publishedAt',
  access: {
    read: publishedOrAuthenticated,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    {
      name: 'youtubePreview',
      type: 'ui',
      admin: {
        components: { Field: '@/payload/admin/components/VideoSourceSummary.tsx#VideoSourceSummary' },
      },
    },
    { ...contentTitleField, label: 'Title on the website' },
    hiddenSlugField(),
    {
      name: 'format',
      type: 'radio',
      label: 'Category',
      options: [
        { label: 'Explainer', value: 'explainer' },
        { label: 'Product demo', value: 'demo' },
      ],
      admin: {
        layout: 'horizontal',
        description:
          'Required to publish. Explainer is "what is" and fundamentals; product demo is how to use the product. Drives the category tabs on /videos.',
      },
    },
    {
      name: 'topics',
      type: 'relationship',
      relationTo: 'videoTopics',
      hasMany: true,
      admin: {
        description:
          'At least one is required to publish. Drives the topic list on /videos. A topic that does not exist yet can be added from the search box.',
        custom: { emptyPlaceholder: 'Search topics…' },
        components: {
          Cell: {
            path: '@/payload/admin/components/RelationshipCell.tsx#RelationshipCell',
            clientProps: { collectionSlug: 'videoTopics' },
          },
        },
      },
    },
    {
      name: 'topicSuggestions',
      type: 'ui',
      admin: {
        components: { Field: '@/payload/admin/components/VideoTopicSuggestions.tsx#VideoTopicSuggestions' },
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      maxLength: SUMMARY_MAX,
      admin: {
        description: `Shown on the card. Required to publish, up to ${SUMMARY_MAX} characters.`,
      },
    },
    {
      name: 'summaryFromYoutube',
      type: 'ui',
      admin: {
        components: { Field: '@/payload/admin/components/UseDescriptionSummary.tsx#UseDescriptionSummary' },
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Show in the hero',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Plays at the top of /videos. Only one video can be featured: publishing this one clears the other. When none is featured, the newest video is.',
      },
    },
    {
      name: 'syncState',
      type: 'select',
      label: 'Review state',
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
        readOnly: true,
        description:
          'Set by the YouTube sync. "Missing" means the video is gone or private on YouTube; it is not unpublished automatically.',
      },
    },
    {
      name: 'durationLabel',
      type: 'text',
      label: 'Length (only if YouTube has none)',
      validate: (value: string | null | undefined) =>
        value == null || value === '' || DURATION_LABEL.test(value)
          ? true
          : 'Use m:ss or h:mm:ss, for example 1:41 or 1:02:10.',
      admin: {
        position: 'sidebar',
        description:
          'The length is read from YouTube. Fill this only when the video shows no length, for example a live stream (1:41).',
      },
    },
    {
      type: 'collapsible',
      label: 'From YouTube (read only)',
      admin: { initCollapsed: true },
      fields: [
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
          admin: { readOnly: true },
        },
        {
          name: 'externalId',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          access: readOnly,
          admin: {
            readOnly: true,
            description: 'The video id on the host (the 11 characters in a YouTube link).',
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
      ],
    },
    { name: 'thumb', type: 'ui', admin: { components: { Cell: '@/payload/admin/components/VideoThumbCell.tsx#VideoThumbCell' } } },
    { name: 'length', type: 'ui', label: 'Length', admin: { components: { Cell: '@/payload/admin/components/VideoLengthCell.tsx#VideoLengthCell' } } },
    { name: 'state', type: 'ui', label: 'State', admin: { components: { Cell: '@/payload/admin/components/VideoStateCell.tsx#VideoStateCell' } } },
    publishedAtField,
    displayPublishedAtField,
    contentUpdatedAtField,
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
      displayPublishedAtAuditHook('videos'),
      singleFeaturedHook,
      revalidateWebPublishAfterChangeHook('videos'),
    ],
    afterDelete: [revalidateWebAfterDeleteHook('videos')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
