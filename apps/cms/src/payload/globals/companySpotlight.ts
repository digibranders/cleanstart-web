import type { GlobalConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

export const CompanySpotlight: GlobalConfig = {
  slug: 'companySpotlight',
  label: 'Company Spotlight',
  admin: {
    description:
      'Optional spotlight card shown in the Company mega menu. Renders only when there are no open careers. Falls back to the Talent Network evergreen when empty or expired.',
    group: 'Marketing',
  },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'headline', type: 'text', required: true, maxLength: 80 },
    { name: 'sub', type: 'text', maxLength: 160 },
    { name: 'ctaLabel', type: 'text', required: true, maxLength: 40 },
    {
      name: 'ctaHref',
      type: 'text',
      required: true,
      hooks: { beforeValidate: [normalizeOptionalUrlHook] },
      validate: validateOptionalUrl,
      admin: {
        description: 'Destination URL or path. Accepts `/site-path` or `https://…`.',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        description: 'After this date, the card is skipped and the evergreen renders.',
      },
    },
  ],
};
