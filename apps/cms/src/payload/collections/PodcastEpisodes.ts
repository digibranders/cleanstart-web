import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload';
import { purgePageUiField } from '../fields/purge-page-ui';

import { isAdminOrEditor, publishedOrAuthenticated } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
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
import { schemaOverrideAuditHook } from '../hooks/schema-override-audit';
import { searchSyncAfterChangeHook, searchSyncAfterDeleteHook } from '../hooks/search-sync';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';

/** Canonical detail-page prefix for podcast episodes — distinct from the
 *  flat ROUTE_PREFIX map because the nested path is `/podcast/episode/<slug>`. */
export const PODCAST_EPISODE_PREFIX = '/podcast/episode';

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
const validateYoutubeUrl = (value: string | string[] | null | undefined): true | string => {
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

/**
 * Enforce a single hero episode. When this episode is flagged `heroEpisode`,
 * clear the flag on every other episode so at most one is ever the /podcast
 * hero. Runs in the same request/transaction, so the switch is atomic — the
 * previously-flagged episode is unflagged as part of the same save.
 */
export const enforceSingleHeroEpisodeHook: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
}) => {
  if (data.heroEpisode !== true) return data;

  const currentId = originalDoc?.id as number | string | undefined;
  await req.payload.update({
    collection: 'podcastEpisodes',
    where:
      currentId === undefined
        ? { heroEpisode: { equals: true } }
        : {
            and: [{ heroEpisode: { equals: true } }, { id: { not_equals: currentId } }],
          },
    data: { heroEpisode: false },
    req,
    overrideAccess: true,
    depth: 0,
  });

  return data;
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
      name: 'episodeNumber',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Sequential episode number, rendered as "Episode N" on cards and the hero.',
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
      guidance: {
        dimensions: '1280 × 720 px',
        aspectRatio: '16:9 (landscape)',
        note: 'Overrides the YouTube thumbnail. Match YouTube’s 16:9 frame so it lines up with the player.',
      },
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
        description: 'When on, this episode appears in the Featured Content section on /podcast.',
      },
    },
    {
      name: 'heroEpisode',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'When on, this episode is the embedded video in the /podcast hero (e.g. the Introduction). Only one episode can be the hero — turning this on clears it on any other episode. If none is set, the newest episode is used.',
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
    {
      name: 'permalink',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/PermalinkField.tsx#PermalinkField',
            clientProps: { pathPrefix: PODCAST_EPISODE_PREFIX },
          },
        },
      },
    },
    schemaAddonsField,
    publishedAtField,
    displayPublishedAtField,
    ...seoSidebarFields({ pathPrefix: PODCAST_EPISODE_PREFIX, descriptionSource: 'abstract' }),
    ...seoFieldsForSidebar('podcastEpisodes'),
  ],
  hooks: {
    beforeChange: [
      stampYoutubeVideoIdHook,
      enforceSingleHeroEpisodeHook,
      firstPublishHook(),
      displayPublishedAtBackfillHook,
    ],
    afterChange: [
      slugChangeRedirectHook('podcastEpisodes'),
      schemaOverrideAuditHook('podcastEpisodes'),
      displayPublishedAtAuditHook('podcastEpisodes'),
      searchSyncAfterChangeHook('podcastEpisodes'),
      webhooksPublishAfterChangeHook('podcastEpisodes'),
      indexNowPublishAfterChangeHook('podcastEpisodes'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('podcastEpisodes')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
