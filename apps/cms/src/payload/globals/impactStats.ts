import type { GlobalConfig } from 'payload';

import { isAdminOrEditor } from '../access';

export const ImpactStats: GlobalConfig = {
  slug: 'impactStats',
  label: 'Impact Stats',
  admin: {
    description:
      'Headline impact metrics shown across marketing surfaces (home stats band, CISO outcomes) and consumed by the Images catalog hero. Edit here to update everywhere.',
    group: 'Globals',
  },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  fields: [
    {
      name: 'stats',
      type: 'array',
      label: 'Stats',
      labels: { singular: 'Stat', plural: 'Stats' },
      minRows: 1,
      maxRows: 8,
      admin: {
        description: 'Each stat has a display value and a label. Drag to reorder.',
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          admin: { description: 'Display value, e.g. "88,000+", "90%+", "10M+".' },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: { description: 'Short caption, e.g. "CVEs remediated".' },
        },
      ],
    },
  ],
};
