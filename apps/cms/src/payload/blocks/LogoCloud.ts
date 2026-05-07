import type { Block } from 'payload';

import { mediaUploadField } from '../fields/media-upload';

export const LogoCloud: Block = {
  slug: 'logoCloud',
  labels: { singular: 'Logo cloud', plural: 'Logo clouds' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'logos',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Logo', plural: 'Logos' },
      fields: [
        mediaUploadField({ name: 'image', required: true, folderHint: 'web/general' }),
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
