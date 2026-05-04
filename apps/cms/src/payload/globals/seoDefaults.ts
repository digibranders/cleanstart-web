import type { GlobalConfig } from 'payload';

import { isAdmin, isAuthenticated } from '../access';

export const SeoDefaults: GlobalConfig = {
  slug: 'seoDefaults',
  label: 'SEO defaults',
  admin: { group: 'Globals' },
  access: {
    read: isAuthenticated,
    update: isAdmin,
  },
  versions: { drafts: false, max: 50 },
  fields: [
    {
      name: 'defaultTitleTemplate',
      type: 'text',
      defaultValue: '%s — CleanStart',
      admin: {
        description:
          'Used when seo.title is unset. %s is replaced with the document title.',
      },
    },
    {
      name: 'defaultDescription',
      type: 'textarea',
      admin: {
        description: 'Site-wide fallback for seo.description when nothing else is set.',
      },
    },
    {
      name: 'defaultOgImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Site-wide fallback when seo.ogImage and the page hero are both empty.',
      },
    },
    {
      name: 'twitterHandle',
      type: 'text',
      admin: { description: 'Used as twitter:site fallback when no author handle is set.' },
    },
    {
      type: 'group',
      name: 'organizationJsonLd',
      label: 'Organization JSON-LD',
      admin: {
        description:
          'Surfaced on every page as the publisher reference. Required for News content.',
      },
      fields: [
        { name: 'name', type: 'text', defaultValue: 'CleanStart, Inc.' },
        { name: 'legalName', type: 'text' },
        { name: 'url', type: 'text', defaultValue: 'https://cleanstart.com' },
        { name: 'logo', type: 'upload', relationTo: 'media' },
        {
          name: 'sameAs',
          type: 'array',
          labels: { singular: 'Profile URL', plural: 'sameAs profile URLs' },
          admin: {
            description: 'Authoritative profile URLs (LinkedIn, GitHub, Crunchbase, etc.).',
          },
          fields: [{ name: 'url', type: 'text', required: true }],
        },
      ],
    },
  ],
};
