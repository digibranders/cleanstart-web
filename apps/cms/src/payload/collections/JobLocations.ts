import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { slugField } from '../fields/slug';

const ISO_3166_ALPHA_2 = /^[A-Z]{2}$/;

export const JobLocations: CollectionConfig = {
  slug: 'jobLocations',
  labels: { singular: 'Job location', plural: 'Job locations' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'isoCountry', 'updatedAt'],
    group: 'Taxonomies',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField({ source: 'name' }),
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'city',
      options: [
        { label: 'Country', value: 'country' },
        { label: 'Region', value: 'region' },
        { label: 'City', value: 'city' },
      ],
    },
    {
      name: 'isoCountry',
      type: 'text',
      required: true,
      admin: {
        description: 'ISO 3166-1 alpha-2 country code (e.g. IN, US, GB). Two uppercase letters.',
      },
      validate: (value: string | string[] | null | undefined): true | string => {
        if (typeof value !== 'string' || !ISO_3166_ALPHA_2.test(value)) {
          return 'Must be a 2-letter uppercase ISO 3166-1 alpha-2 country code.';
        }
        return true;
      },
    },
  ],
  timestamps: true,
};
