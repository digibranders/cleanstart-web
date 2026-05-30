import type { GlobalConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

/**
 * Page-level configuration for the public `/podcast` route. Read access
 * is intentionally public — `apps/web` fetches this anonymously via
 * `/api/globals/podcastPage`, the same way listing pages read their
 * episodes. Updates are gated to admin / editor.
 *
 * The field shape mirrors the `PodcastPage` type in
 * `apps/web/src/lib/podcast.ts`; any rename or restructuring here must
 * land in the same commit as the web-side type to avoid runtime drift.
 */
export const PodcastPage: GlobalConfig = {
  slug: 'podcastPage',
  label: 'Podcast page',
  admin: { group: 'Globals' },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  versions: { drafts: false, max: 50 },
  fields: [
    {
      name: 'heroEyebrow',
      type: 'text',
      admin: {
        description: 'Small tag above the hero title. Optional.',
      },
    },
    {
      name: 'heroTitle',
      type: 'text',
      required: true,
      defaultValue: 'Leadership Exchange',
      admin: {
        description:
          'Full hero title. Use heroTitleHighlight to mark the word(s) that should render in the accent colour.',
      },
    },
    {
      name: 'heroTitleHighlight',
      type: 'text',
      required: true,
      defaultValue: 'Exchange',
      admin: {
        description:
          'Substring of heroTitle that renders in the accent colour (case-sensitive match).',
      },
    },
    {
      name: 'heroSubtitle',
      type: 'textarea',
      admin: {
        description: 'One- or two-line subtitle shown beneath the hero title.',
      },
    },
    {
      name: 'featuredHeroEpisode',
      type: 'relationship',
      relationTo: 'podcastEpisodes',
      admin: {
        description:
          'Episode shown in the hero embed. Leave empty to fall back to the most recent published episode.',
      },
    },
    {
      name: 'latestEpisodesTitle',
      type: 'text',
      defaultValue: 'Latest Episodes',
    },
    {
      name: 'latestEpisodesLimit',
      type: 'number',
      defaultValue: 6,
      min: 1,
      max: 24,
      admin: {
        description: 'How many recent episodes to render on the listing grid.',
      },
    },
    {
      name: 'featuredSectionTitle',
      type: 'text',
      defaultValue: 'Featured Content',
      admin: {
        description:
          'Heading for the Featured Content section. Pair with featuredSectionHighlight to mark the accent-coloured word(s).',
      },
    },
    {
      name: 'featuredSectionHighlight',
      type: 'text',
      defaultValue: 'Content',
      admin: {
        description:
          'Substring of featuredSectionTitle that renders in the accent colour (case-sensitive match).',
      },
    },
    {
      name: 'ctaCards',
      type: 'array',
      maxRows: 6,
      labels: { singular: 'CTA card', plural: 'CTA cards' },
      admin: {
        description:
          'Cards rendered above the footer. Leave empty to fall back to the built-in defaults.',
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
        { name: 'ctaLabel', type: 'text', required: true },
        {
          name: 'ctaHref',
          type: 'text',
          required: true,
          hooks: { beforeValidate: [normalizeOptionalUrlHook] },
          validate: validateOptionalUrl,
          admin: {
            description:
              'Destination URL or path. Accepts `/site-path` or `https://…`.',
          },
        },
      ],
    },
  ],
};
