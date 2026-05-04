import type { Block } from 'payload';

export const Testimonial: Block = {
  slug: 'testimonial',
  labels: { singular: 'Testimonial', plural: 'Testimonials' },
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    { name: 'person', type: 'text', required: true },
    { name: 'role', type: 'text' },
    { name: 'company', type: 'text' },
    { name: 'companyLogo', type: 'upload', relationTo: 'media' },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
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
