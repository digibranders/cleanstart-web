import type { Block } from 'payload';

/**
 * Layout primitive — variant + nested children. Lets editors compose
 * "image left, text right" without spawning a custom block per pattern.
 *
 * Block schemas filled in via `nestableBlocks` reference at registration
 * time (see blocks/index.ts) so circular imports stay flat.
 */
export const Section = (nestableBlocks: Block[]): Block => ({
  slug: 'section',
  labels: { singular: 'Section', plural: 'Sections' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'stack',
      options: [
        { label: 'Stack (single column)', value: 'stack' },
        { label: 'Two column', value: 'two-column' },
      ],
    },
    {
      name: 'gap',
      type: 'select',
      defaultValue: 'md',
      options: [
        { label: 'Tight', value: 'sm' },
        { label: 'Default', value: 'md' },
        { label: 'Spacious', value: 'lg' },
      ],
    },
    {
      name: 'alignment',
      type: 'select',
      defaultValue: 'start',
      options: [
        { label: 'Start', value: 'start' },
        { label: 'Center', value: 'center' },
        { label: 'End', value: 'end' },
      ],
    },
    {
      name: 'background',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Surface (subtle)', value: 'surface' },
        { label: 'Inverted', value: 'inverted' },
      ],
    },
    {
      name: 'children',
      type: 'blocks',
      blocks: nestableBlocks,
      required: true,
      admin: {
        description: 'Nested blocks rendered in the chosen variant + gap + alignment.',
      },
    },
  ],
});
