import type { GlobalConfig } from 'payload';

import { isAdminOrEditor, isAuthenticated } from '../access';
import { mediaUploadField } from '../fields/media-upload';
import { normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

import { navItemFields } from './_navItem';

const MAX_FOOTER_COLUMNS = 5;
const MAX_BADGES = 6;

export const FooterNav: GlobalConfig = {
  slug: 'footerNav',
  label: 'Footer navigation',
  admin: { group: 'Globals' },
  access: {
    read: isAuthenticated,
    update: isAdminOrEditor,
  },
  versions: { drafts: false, max: 50 },
  fields: [
    {
      name: 'columns',
      type: 'array',
      maxRows: MAX_FOOTER_COLUMNS,
      labels: { singular: 'Column', plural: 'Columns' },
      fields: [
        { name: 'heading', type: 'text', required: true },
        {
          name: 'items',
          type: 'array',
          labels: { singular: 'Link', plural: 'Links' },
          fields: navItemFields,
        },
      ],
    },
    {
      name: 'social',
      type: 'array',
      labels: { singular: 'Profile', plural: 'Social profiles' },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Twitter', value: 'twitter' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'GitHub', value: 'github' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Mastodon', value: 'mastodon' },
            { label: 'Bluesky', value: 'bluesky' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          hooks: { beforeValidate: [normalizeOptionalUrlHook] },
          validate: validateOptionalUrl,
        },
      ],
    },
    {
      name: 'legalLinks',
      type: 'array',
      labels: { singular: 'Legal link', plural: 'Legal strip links' },
      admin: {
        description:
          'Bottom-strip links (Privacy / Terms / AUP / Cookie Settings). Pre-seeded from the legal global on first save.',
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'target', type: 'relationship', relationTo: 'pages' },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      defaultValue: '© {year} CleanStart, Inc. All rights reserved.',
      admin: {
        description:
          '{year} is replaced at render time so the line never goes stale on Jan 1.',
      },
    },
    {
      name: 'badges',
      type: 'array',
      maxRows: MAX_BADGES,
      labels: { singular: 'Badge', plural: 'Trust badges' },
      admin: {
        description:
          'Trust badges (SOC 2, FIPS-validated, ISO 27001) shown above the legal strip.',
      },
      fields: [
        mediaUploadField({ name: 'image', required: true, folderHint: 'web/general' }),
        { name: 'alt', type: 'text', required: true },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'newsletterSignup',
      type: 'relationship',
      relationTo: 'forms',
      admin: {
        description:
          'Optional inline newsletter signup. When set, the picked form replaces the first column.',
      },
    },
  ],
};
