import type { Block } from 'payload';

export const JobsList: Block = {
  slug: 'jobsList',
  labels: { singular: 'Jobs list', plural: 'Jobs lists' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'sub', type: 'textarea' },
    {
      type: 'group',
      name: 'filters',
      label: 'Auto-filter (optional)',
      admin: {
        description:
          'When set, only matching jobs render. Leave all blank to render every open job.',
      },
      fields: [
        {
          name: 'department',
          type: 'select',
          options: [
            { label: 'Engineering', value: 'engineering' },
            { label: 'Sales', value: 'sales' },
            { label: 'Marketing', value: 'marketing' },
            { label: 'Customer Success', value: 'customer-success' },
            { label: 'Operations', value: 'operations' },
            { label: 'Finance', value: 'finance' },
            { label: 'Legal', value: 'legal' },
            { label: 'People', value: 'people' },
          ],
        },
        {
          name: 'locations',
          type: 'relationship',
          relationTo: 'jobLocations',
          hasMany: true,
        },
        {
          name: 'remoteOnly',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'showFilters',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Show department / location filter chips above the list.',
      },
    },
    {
      name: 'emptyMessage',
      type: 'text',
      defaultValue: 'No openings right now — check back soon.',
    },
  ],
};
