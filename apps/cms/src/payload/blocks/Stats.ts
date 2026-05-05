import type { Block } from 'payload';

export const Stats: Block = {
  slug: 'stats',
  labels: { singular: 'Stats', plural: 'Stats blocks' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'metrics',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Metric', plural: 'Metrics' },
      fields: [
        { name: 'value', type: 'text', required: true, admin: { description: 'e.g. "10×" or "99.99%".' } },
        { name: 'label', type: 'text', required: true },
        { name: 'sublabel', type: 'text' },
      ],
    },
  ],
};
