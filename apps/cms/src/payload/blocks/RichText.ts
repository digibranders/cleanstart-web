import type { Block } from 'payload';

export const RichText: Block = {
  slug: 'richText',
  labels: { singular: 'Rich text', plural: 'Rich text' },
  fields: [
    {
      name: 'body',
      type: 'richText',
      required: true,
    },
    {
      name: 'maxWidth',
      type: 'select',
      defaultValue: 'prose',
      options: [
        { label: 'Prose (~65ch — readable)', value: 'prose' },
        { label: 'Wide (full container)', value: 'wide' },
      ],
    },
  ],
};
