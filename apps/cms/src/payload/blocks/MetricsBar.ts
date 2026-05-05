import type { Block } from 'payload';

export const MetricsBar: Block = {
  slug: 'metricsBar',
  labels: { singular: 'Metrics bar', plural: 'Metrics bars' },
  fields: [
    {
      name: 'metrics',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Metric', plural: 'Metrics' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'value', type: 'text', required: true },
      ],
    },
    {
      name: 'background',
      type: 'select',
      defaultValue: 'inverted',
      options: [
        { label: 'Inverted (dark stripe)', value: 'inverted' },
        { label: 'Surface', value: 'surface' },
      ],
    },
  ],
};
