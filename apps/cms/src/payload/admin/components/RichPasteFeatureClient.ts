'use client';

import { createClientFeature } from '@payloadcms/richtext-lexical/client';

import { RichPastePlugin } from './RichPastePlugin';

/**
 * Client-side Lexical feature: registers the `RichPastePlugin` into
 * the editor's plugin tree at the `normal` slot. The plugin handles
 * `PASTE_COMMAND` for the entire editor instance — so any rich-text
 * field in the admin (body, FAQ answers, article sections, etc.)
 * gets the auto-formatting paste behaviour.
 */
export const RichPasteFeatureClient = createClientFeature(() => ({
  plugins: [
    {
      Component: RichPastePlugin,
      position: 'normal',
    },
  ],
}));
