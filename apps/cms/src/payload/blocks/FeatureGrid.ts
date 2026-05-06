import type { Block } from 'payload';

import { linkField } from '../fields/link';
import { mediaUploadField } from '../fields/media-upload';

export const FeatureGrid: Block = {
  slug: 'featureGrid',
  labels: { singular: 'Feature grid', plural: 'Feature grids' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'sub', type: 'textarea' },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '2 columns', value: '2' },
        { label: '3 columns', value: '3' },
        { label: '4 columns', value: '4' },
      ],
    },
    {
      name: 'features',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Feature', plural: 'Features' },
      fields: [
        mediaUploadField({ name: 'icon', folderHint: 'web/general' }),
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea' },
        linkField({ name: 'link', withText: true }),
      ],
    },
  ],
};
