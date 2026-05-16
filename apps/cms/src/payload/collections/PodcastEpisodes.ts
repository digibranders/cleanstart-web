import type { CollectionConfig, FieldHook } from 'payload';

import { isAdminOrEditor } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { mediaUploadField } from '../fields/media-upload';
import { publishedAtField } from '../fields/published-at';
import { schemaAddonsField } from '../fields/schema-addons';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { firstPublishHook } from '../hooks/first-publish';
import { schemaOverrideAuditHook } from '../hooks/schema-override-audit';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { extractYoutubeId, validateYoutubeUrl } from '../lib/youtube';

const youtubeVideoIdHook: FieldHook = ({ siblingData }) => {
  const url = (siblingData as { youtubeUrl?: unknown })?.youtubeUrl;
  return typeof url === 'string' ? extractYoutubeId(url) : null;
};

export const PodcastEpisodes: CollectionConfig = {
  slug: 'podcastEpisodes',
  labels: { singular: 'Podcast episode', plural: 'Podcast episodes' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'title',
      'episodeNumber',
      'featured',
      'publicationDate',
      '_status',
      'updatedAt',
    ],
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
      name: 'episodeNumber',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Shown on the card pill (e.g. "Episode 1").',
        step: 1,
      },
    },
    {
      name: 'youtubeUrl',
      type: 'text',
      required: true,
      admin: {
        description:
          'Paste any YouTube link (youtube.com/watch?v=…, youtu.be/…, or youtube.com/embed/…). The 11-char video id is extracted on save.',
      },
      validate: validateYoutubeUrl,
    },
    {
      name: 'youtubeVideoId',
      type: 'text',
      access: { update: () => false },
      admin: { readOnly: true, hidden: true },
      hooks: {
        beforeChange: [youtubeVideoIdHook],
      },
    },
    mediaUploadField({
      name: 'thumbnailOverride',
      folderHint: 'web/podcast',
      description:
        'Optional. Defaults to the YouTube maxresdefault thumbnail if blank.',
    }),
    { name: 'abstract', type: 'textarea' },
    {
      name: 'guests',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
      filterOptions: {
        acceptingNewBylines: { not_equals: false },
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Show in the Featured Content row. The newest two featured episodes are picked automatically.',
      },
    },
    {
      name: 'durationSeconds',
      type: 'number',
      min: 1,
      admin: { description: 'Optional. Used in PodcastEpisode JSON-LD timeRequired.' },
    },
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
      name: 'permalink',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/PermalinkField.tsx#PermalinkField',
            clientProps: { pathPrefix: '/podcast#episode-' },
          },
        },
      },
    },
    schemaAddonsField,
    publishedAtField,
    ...seoSidebarFields({ pathPrefix: '/podcast', descriptionSource: 'abstract' }),
    ...seoFieldsForSidebar('podcastEpisodes'),
  ],
  hooks: {
    beforeChange: [firstPublishHook()],
    afterChange: [
      slugChangeRedirectHook('podcastEpisodes'),
      schemaOverrideAuditHook('podcastEpisodes'),
    ],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
