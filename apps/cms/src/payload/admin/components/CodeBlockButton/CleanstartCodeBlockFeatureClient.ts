'use client';

import { createClientFeature } from '@payloadcms/richtext-lexical/client';

import { CodeBlockToolbarButton } from './CodeBlockToolbarButton';

// Merge into the stock `format` group (key `format`, order 40) so the `<>`
// button sits among the inline format marks — the same cluster, and very
// nearly the same slot, the inline-code button occupied before it was
// removed. A high item order parks it at the end of the marks
// (bold/italic/underline/strike/sub/sup).
const codeBlockGroup = {
  type: 'buttons' as const,
  key: 'format',
  order: 40,
  items: [
    {
      Component: CodeBlockToolbarButton,
      isEnabled: (): boolean => true,
      key: 'cs-code-block',
      order: 100,
    },
  ],
};

export const CleanstartCodeBlockFeatureClient = createClientFeature(() => ({
  toolbarFixed: { groups: [codeBlockGroup] },
}));
