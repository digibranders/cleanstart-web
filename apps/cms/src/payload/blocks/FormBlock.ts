import type { Block } from 'payload';

export const FormBlock: Block = {
  slug: 'formBlock',
  labels: { singular: 'Form block', plural: 'Form blocks' },
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      admin: { description: 'Pick a form. Submissions flow through the same LeadHandler chain.' },
    },
    { name: 'headline', type: 'text' },
    { name: 'description', type: 'textarea' },
    {
      name: 'overridePostSubmit',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Inherit the form\'s postSubmit unless overridden here. Useful when the same form lives on multiple pages.',
      },
    },
    {
      name: 'postSubmit',
      type: 'group',
      admin: { condition: (_data, sibling) => sibling?.overridePostSubmit === true },
      fields: [
        {
          name: 'kind',
          type: 'select',
          defaultValue: 'message',
          options: [
            { label: 'Show a thank-you message', value: 'message' },
            { label: 'Redirect to a URL', value: 'redirect' },
          ],
        },
        {
          name: 'body',
          type: 'richText',
          admin: { condition: (_data, sibling) => sibling?.kind === 'message' },
        },
        {
          name: 'url',
          type: 'text',
          admin: { condition: (_data, sibling) => sibling?.kind === 'redirect' },
        },
      ],
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'inline',
      options: [
        { label: 'Inline (single-column)', value: 'inline' },
        { label: 'Side-by-side (form right, copy left)', value: 'split' },
      ],
    },
  ],
};
