import type { Block } from 'payload';

const CELL_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Check (✓)', value: 'check' },
  { label: 'Cross (✗)', value: 'cross' },
  { label: 'Partial (~)', value: 'partial' },
] as const;

export const Table: Block = {
  slug: 'table',
  labels: { singular: 'Table', plural: 'Tables' },
  fields: [
    {
      name: 'caption',
      type: 'text',
      admin: { description: 'Caption rendered as <caption> for screen readers + visible above the table.' },
    },
    {
      name: 'headers',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Header', plural: 'Headers' },
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'highlight',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Visually emphasises this column (e.g. the "us" column on a comparison table).',
          },
        },
      ],
    },
    {
      name: 'firstColIsHeader',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Render the first cell of each row as <th scope="row"> for screen readers (default for comparison tables).',
      },
    },
    {
      name: 'stickyFirstColumn',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Pin the first column when the table scrolls horizontally on narrow viewports.',
      },
    },
    {
      name: 'rows',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Row', plural: 'Rows' },
      fields: [
        {
          name: 'cells',
          type: 'array',
          required: true,
          minRows: 1,
          labels: { singular: 'Cell', plural: 'Cells' },
          fields: [
            {
              name: 'type',
              type: 'select',
              defaultValue: 'text',
              options: CELL_TYPES as unknown as { label: string; value: string }[],
            },
            {
              name: 'value',
              type: 'text',
              admin: {
                description:
                  'Text contents. Required for type=text; optional override caption for check/cross/partial cells.',
                condition: (_data, sibling) =>
                  sibling?.type === 'text' || typeof sibling?.value === 'string',
              },
            },
            {
              name: 'tooltip',
              type: 'text',
              admin: { description: 'Optional hover tooltip with extra context.' },
            },
          ],
        },
      ],
    },
  ],
};
