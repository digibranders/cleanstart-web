import type { GlobalConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { validateOptionalUrl } from '../lib/url-shape';

export const PodcastPage: GlobalConfig = {
  slug: 'podcastPage',
  label: 'Podcast page',
  admin: {
    group: 'Globals',
    description:
      'Editor-facing chrome for /podcast — hero copy, featured hero episode, and the three CTA cards at the bottom.',
  },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  versions: { drafts: false, max: 25 },
  fields: [
    {
      name: 'heroEyebrow',
      type: 'text',
      admin: { description: 'Optional eyebrow shown above the hero title.' },
    },
    {
      name: 'heroTitle',
      type: 'text',
      required: true,
      defaultValue: 'Leadership Exchange',
    },
    {
      name: 'heroTitleHighlight',
      type: 'text',
      required: true,
      defaultValue: 'Exchange',
      admin: {
        description:
          'Substring of Hero title rendered in the blue gradient. Must appear in Hero title exactly once.',
      },
    },
    {
      name: 'heroSubtitle',
      type: 'textarea',
      defaultValue:
        'Where industry leaders decode container security and define the future of the software supply chain.',
    },
    {
      name: 'featuredHeroEpisode',
      type: 'relationship',
      relationTo: 'podcastEpisodes',
      required: true,
      admin: { description: 'Big video at the top of the hero.' },
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
      max: 12,
      admin: { description: 'How many cards to render in the Latest Episodes grid (1–12).' },
    },
    {
      name: 'featuredSectionTitle',
      type: 'text',
      defaultValue: 'Featured Content',
    },
    {
      name: 'featuredSectionHighlight',
      type: 'text',
      defaultValue: 'Content',
      admin: {
        description:
          'Substring of Featured section title rendered in the blue gradient. Must appear in the title exactly once.',
      },
    },
    {
      name: 'ctaCards',
      type: 'array',
      minRows: 3,
      maxRows: 3,
      defaultValue: [
        {
          title: 'Explore Resources',
          body: 'Read the latest developments shaping CleanStart and the industry.',
          ctaLabel: 'Resource Center',
          ctaHref: '/resource-center',
        },
        {
          title: "See What's New",
          body: 'Pre-built, optimized base images with near-zero CVEs and automatic versioned updates.',
          ctaLabel: 'Read Blogs',
          ctaHref: '/blogs',
        },
        {
          title: 'Get Updates',
          body: 'Join our mailing list for curated insights and upcoming sessions.',
          ctaLabel: 'Sign Up',
          ctaHref: '#',
        },
      ],
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
        { name: 'ctaLabel', type: 'text', required: true },
        {
          name: 'ctaHref',
          type: 'text',
          required: true,
          validate: validateOptionalUrl,
        },
      ],
    },
  ],
};
