import type { Block } from 'payload';

export const LogoCloud: Block = {
  slug: 'logoCloud',
  labels: { singular: 'Logo cloud', plural: 'Logo clouds' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'logos',
      type: 'array',
      required: true,
      labels: { singular: 'Logo', plural: 'Logos' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'alt', type: 'text', required: true },
        { name: 'url', type: 'text' },
      ],
    },
    {
      name: 'monochrome',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Render logos in a uniform single colour for visual rhythm.',
      },
    },
  ],
};
