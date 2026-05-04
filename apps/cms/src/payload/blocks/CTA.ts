import type { Block } from 'payload';

import { ctaButtonFields } from './cta-button';

export const CTA: Block = {
  slug: 'cta',
  labels: { singular: 'CTA', plural: 'CTAs' },
  fields: [
    { name: 'headline', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    ctaButtonFields('primaryCta', 'Primary CTA'),
    ctaButtonFields('secondaryCta', 'Secondary CTA (optional)'),
    {
      name: 'background',
      type: 'select',
      defaultValue: 'surface',
      options: [
        { label: 'Surface (subtle)', value: 'surface' },
        { label: 'Inverted', value: 'inverted' },
        { label: 'Brand', value: 'brand' },
      ],
    },
  ],
};
