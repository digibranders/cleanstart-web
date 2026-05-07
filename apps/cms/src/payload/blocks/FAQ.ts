import type { Block } from 'payload';

export const FAQ: Block = {
  slug: 'faq',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'sub', type: 'textarea' },
    {
      name: 'bulkPaste',
      type: 'ui',
      admin: {
        components: {
          Field: '@/payload/admin/components/FaqBulkPaste.tsx#FaqBulkPaste',
        },
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Question', plural: 'Questions' },
      admin: {
        description:
          'Renders as Radix Accordion + emits FAQPage JSON-LD when non-empty. At least one Q+A required.',
        components: {
          RowLabel: '@/payload/admin/components/FaqRowLabel.tsx#FaqRowLabel',
        },
      },
      fields: [
        { name: 'question', type: 'text', required: true },
        // Plain-text answer — matches Schema.org `acceptedAnswer.text`
        // (which expects a string), keeps each row compact, and lines
        // up with how `parseFaqBulk` already produces plain paragraphs.
        // Multiple paragraphs supported via line breaks.
        { name: 'answer', type: 'textarea', required: true },
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
