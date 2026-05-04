import type { GlobalConfig } from 'payload';

import { isAdmin, isAuthenticated } from '../access';

export const Legal: GlobalConfig = {
  slug: 'legal',
  label: 'Legal',
  admin: { group: 'Globals' },
  access: {
    read: isAuthenticated,
    update: isAdmin,
  },
  versions: { drafts: false, max: 50 },
  fields: [
    {
      name: 'policyVersion',
      type: 'text',
      required: true,
      admin: {
        description:
          'Date or semver tag bumped on each policy change (e.g. 2026-04-15). Snapshotted onto every lead at submit time for GDPR audit defensibility.',
      },
    },
    {
      name: 'privacy',
      type: 'richText',
      label: 'Privacy policy',
    },
    {
      name: 'terms',
      type: 'richText',
      label: 'Terms of service',
    },
    {
      name: 'aup',
      type: 'richText',
      label: 'Acceptable use policy',
    },
    {
      name: 'dpaContactEmail',
      type: 'email',
      admin: {
        description: 'GDPR DSAR / Data Processing Agreement inbox.',
      },
    },
  ],
};
