import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { mediaUploadField } from '../fields/media-upload';
import { displayPublishedAtField } from '../fields/display-published-at';
import { publishedAtField } from '../fields/published-at';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { displayPublishedAtAuditHook } from '../hooks/display-published-at-audit';
import { displayPublishedAtBackfillHook } from '../hooks/display-published-at-backfill';
import { firstPublishHook } from '../hooks/first-publish';

const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;

const YT_URL_PATTERNS: readonly RegExp[] = [
  /(?:youtube\.com\/watch\?(?:[^&]*&)*v=)([A-Za-z0-9_-]{11})/,
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  /youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{11})/,
];

const extractYoutubeId = (raw: string | null | undefined): string | null => {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (value.length === 0) return null;
  if (YT_ID_RE.test(value)) return value;
  for (const re of YT_URL_PATTERNS) {
    const match = re.exec(value);
    if (match?.[1]) return match[1];
  }
  return null;
};

/**
 * Validator for the `youtubeUrl` field. Required, must resolve to a
 * canonical 11-char YouTube video ID via any of the supported URL
 * shapes (watch / youtu.be / embed / shorts / nocookie). Mirrors the
 * client-side regex set used by `apps/web/src/lib/podcast.ts` so the
 * extracted ID is always renderable as a thumbnail / embed.
 */
const validateYoutubeUrl = (
  value: string | string[] | null | undefined,
): true | string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'YouTube URL is required.';
  }
  if (extractYoutubeId(value) === null) {
    return 'Expected a YouTube URL (watch / youtu.be / embed / shorts) or a bare 11-char video ID.';
  }
  return true;
};

/**
 * Stamp the canonical 11-char YouTube video ID on save. Lets the public
 * site skip URL parsing on every render and gives JSON-LD / thumbnail
 * helpers a stable identifier even if the editor later edits the URL.
 */
const stampYoutubeVideoIdHook: CollectionBeforeChangeHook = ({ data }) => {
  const next = { ...data };
  const url = typeof next.youtubeUrl === 'string' ? next.youtubeUrl : null;
  const id = extractYoutubeId(url);
  if (id !== null) {
    next.youtubeVideoId = id;
  }
  return next;
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
        description:
          'Sequential episode number, rendered as "Episode N" on cards and the hero.',
      },
    },
    {
      name: 'youtubeUrl',
      type: 'text',
      required: true,
      admin: {
        description:
          'Full YouTube URL (watch / youtu.be / embed / shorts). The 11-char video ID is auto-extracted on save and stored in youtubeVideoId.',
      },
      validate: validateYoutubeUrl,
    },
    {
      name: 'youtubeVideoId',
      type: 'text',
      access: { update: () => false },
      admin: {
        readOnly: true,
        description: 'Auto-extracted from youtubeUrl on every save.',
      },
    },
    mediaUploadField({
      name: 'thumbnailOverride',
      folderHint: 'web/general',
      description:
        'Optional custom thumbnail. Leave blank to use YouTube’s maxresdefault thumbnail.',
    }),
    {
      name: 'abstract',
      type: 'textarea',
      admin: {
        description:
          'Short summary shown on listing cards and the featured hero. Keep under ~240 characters.',
      },
    },
    {
      name: 'durationSeconds',
      type: 'number',
      min: 1,
      admin: {
        description:
          'Total runtime in seconds. Surfaced as Schema.org duration / readable runtime badges.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'When on, this episode appears in the Featured Content section on /podcast.',
      },
    },
    {
      name: 'publicationDate',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        description:
          'Defaults to the current moment on creation. Drives sort order on /podcast (newest first).',
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
    },
    publishedAtField,
    displayPublishedAtField,
  ],
  hooks: {
    beforeChange: [stampYoutubeVideoIdHook, firstPublishHook(), displayPublishedAtBackfillHook],
    afterChange: [displayPublishedAtAuditHook('podcastEpisodes')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
