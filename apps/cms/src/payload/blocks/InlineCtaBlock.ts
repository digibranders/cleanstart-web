import type { Block } from 'payload';

/**
 * Inline call-to-action card embedded in a body rich-text field.
 *
 * Webflow stored these as `<div class="artcileCtaBox"><h3>prompt <a>label</a></h3></div>`;
 * the import flattened them to a plain heading + link. This block restores
 * them as a structured, editor-controlled card. Registered inline via
 * `BlocksFeature` in `editor-config.ts` and rendered on the web by the
 * `inlineCta` branch of `renderLexical.tsx`.
 */
export const InlineCtaBlock: Block = {
  slug: 'inlineCta',
  labels: { singular: 'CTA card', plural: 'CTA cards' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      admin: {
        description: 'The prompt line, e.g. "Need to see how this looks in practice?"',
      },
    },
    {
      name: 'buttonLabel',
      type: 'text',
      required: true,
      admin: {
        description: 'Button text, e.g. "Book a quick walkthrough".',
      },
    },
    {
      name: 'buttonUrl',
      type: 'text',
      required: true,
      admin: {
        description: 'Destination — an internal path ("/book-a-demo") or full external URL.',
      },
    },
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'soft',
      options: [
        { label: 'Soft (tinted panel)', value: 'soft' },
        { label: 'Solid (bold panel)', value: 'solid' },
      ],
    },
  ],
};
