import type { Block } from 'payload';

export const IntegrationLogos: Block = {
  slug: 'integrationLogos',
  labels: { singular: 'Integration logos', plural: 'Integration logos' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'sub', type: 'textarea' },
    {
      name: 'integrations',
      type: 'array',
      required: true,
      labels: { singular: 'Integration', plural: 'Integrations' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'logo', type: 'upload', relationTo: 'media', required: true },
        {
          name: 'category',
          type: 'select',
          options: [
            { label: 'CI/CD', value: 'ci-cd' },
            { label: 'Container registry', value: 'registry' },
            { label: 'Kubernetes', value: 'kubernetes' },
            { label: 'Cloud', value: 'cloud' },
            { label: 'Security', value: 'security' },
            { label: 'Observability', value: 'observability' },
            { label: 'Other', value: 'other' },
          ],
        },
        { name: 'url', type: 'text' },
      ],
    },
  ],
};
