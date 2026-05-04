import type { Block } from 'payload';

import { ctaButtonFields } from './cta-button';

export const Hero: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      admin: { description: 'Optional small line above the headline (e.g. "New").' },
    },
    {
      name: 'headline',
      type: 'text',
      required: true,
    },
    {
      name: 'sub',
      type: 'textarea',
    },
    ctaButtonFields('primaryCta', 'Primary CTA'),
    ctaButtonFields('secondaryCta', 'Secondary CTA (optional)'),
    {
      name: 'background',
      type: 'group',
      fields: [
        {
          name: 'kind',
          type: 'select',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Image', value: 'image' },
            { label: 'Video (mp4)', value: 'video' },
            { label: 'Gradient', value: 'gradient' },
          ],
        },
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
          admin: {
            condition: (_data, sibling) => sibling?.kind === 'image' || sibling?.kind === 'video',
          },
        },
      ],
    },
  ],
};
