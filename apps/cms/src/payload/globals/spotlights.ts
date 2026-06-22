import type { Field, GlobalConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

// Shared shape for both mega-menu spotlight cards. Fields are optional (each
// card is optional and falls back to its evergreen) — the web resolver checks
// for ctaLabel/ctaHref presence before rendering.
const spotlightFields = (): Field[] => [
  { name: 'image', type: 'upload', relationTo: 'media' },
  { name: 'headline', type: 'text', maxLength: 80 },
  { name: 'sub', type: 'text', maxLength: 160 },
  { name: 'ctaLabel', type: 'text', maxLength: 40 },
  {
    name: 'ctaHref',
    type: 'text',
    hooks: { beforeValidate: [normalizeOptionalUrlHook] },
    validate: validateOptionalUrl,
    admin: { description: 'Destination URL or path. Accepts `/site-path` or `https://…`.' },
  },
  {
    name: 'expiresAt',
    type: 'date',
    admin: { description: 'After this date, the card is skipped and the evergreen renders.' },
  },
];

/**
 * Merged mega-menu spotlight cards (replaces the former resourcesSpotlight +
 * companySpotlight globals — identical structure). One global, two groups.
 */
export const Spotlights: GlobalConfig = {
  slug: 'spotlights',
  label: 'Spotlights',
  admin: {
    group: 'Globals',
    description: 'Optional spotlight cards in the Resources and Company mega-menus.',
  },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  fields: [
    {
      type: 'group',
      name: 'resources',
      label: 'Resources Spotlight',
      admin: {
        description:
          'Shown in the Resources mega menu. Falls back to the Bulletin evergreen when no event/webinar is upcoming and this is empty or expired.',
      },
      fields: spotlightFields(),
    },
    {
      type: 'group',
      name: 'company',
      label: 'Company Spotlight',
      admin: {
        description:
          'Shown in the Company mega menu when there are no open careers. Falls back to the Talent Network evergreen when empty or expired.',
      },
      fields: spotlightFields(),
    },
  ],
};
