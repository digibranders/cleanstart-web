import type { Block } from 'payload';

export const FAQ: Block = {
  slug: 'faq',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'sub', type: 'textarea' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Question', plural: 'Questions' },
      admin: {
        description:
          'Renders as Radix Accordion + emits FAQPage JSON-LD when non-empty. At least one Q+A required.',
      },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'richText', required: true },
      ],
    },
    {
      name: 'allowMultipleOpen',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'When off, opening one row collapses others. Default off matches WAI-ARIA disclosure pattern.',
      },
    },
  ],
};
