import type { Block } from 'payload';

import { mediaUploadField } from '../fields/media-upload';

export const Testimonial: Block = {
  slug: 'testimonial',
  labels: { singular: 'Testimonial', plural: 'Testimonials' },
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    { name: 'person', type: 'text', required: true },
    { name: 'role', type: 'text' },
    { name: 'company', type: 'text' },
    mediaUploadField({ name: 'companyLogo', folderHint: 'web/general' }),
    mediaUploadField({ name: 'avatar', folderHint: 'web/general' }),
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'card',
      options: [
        { label: 'Card', value: 'card' },
        { label: 'Pull quote (large)', value: 'pull-quote' },
      ],
    },
  ],
};
