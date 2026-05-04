import type { Block } from 'payload';

import { ctaButtonFields } from './cta-button';

export const Pricing: Block = {
  slug: 'pricing',
  labels: { singular: 'Pricing', plural: 'Pricing blocks' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'sub', type: 'textarea' },
    {
      name: 'billingToggle',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Show a monthly / yearly toggle. When enabled, each tier needs both monthly and yearly prices.',
      },
    },
    {
      name: 'tiers',
      type: 'array',
      required: true,
      labels: { singular: 'Tier', plural: 'Tiers' },
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'price',
          type: 'group',
          fields: [
            {
              name: 'monthly',
              type: 'text',
              admin: { description: 'e.g. "$49" or "Custom" or "Free".' },
            },
            {
              name: 'yearly',
              type: 'text',
              admin: { description: 'Per-month equivalent of the annual plan.' },
            },
            {
              name: 'currency',
              type: 'select',
              defaultValue: 'USD',
              options: [
                { label: 'USD', value: 'USD' },
                { label: 'EUR', value: 'EUR' },
                { label: 'GBP', value: 'GBP' },
                { label: 'INR', value: 'INR' },
              ],
            },
          ],
        },
        { name: 'tagline', type: 'text' },
        {
          name: 'features',
          type: 'array',
          required: true,
          labels: { singular: 'Feature', plural: 'Features' },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'tooltip', type: 'text' },
            {
              name: 'included',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Off renders the row struck-through (denoting "not included").' },
            },
          ],
        },
        ctaButtonFields('cta', 'CTA'),
        {
          name: 'highlight',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Visually emphasises this tier as the recommended option.',
          },
        },
        {
          name: 'highlightLabel',
          type: 'text',
          defaultValue: 'Most popular',
          admin: {
            condition: (_data, sibling) => sibling?.highlight === true,
          },
        },
      ],
    },
  ],
};
