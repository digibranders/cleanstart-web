import type { Block } from 'payload';

import { mediaUploadField } from '../fields/media-upload';

export const Gallery: Block = {
  slug: 'gallery',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Masonry', value: 'masonry' },
        { label: 'Carousel', value: 'carousel' },
      ],
    },
    {
      name: 'images',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Image', plural: 'Images' },
      fields: [
        mediaUploadField({ name: 'media', required: true, folderHint: 'web/page' }),
        { name: 'caption', type: 'text' },
        { name: 'link', type: 'text' },
      ],
    },
  ],
};
