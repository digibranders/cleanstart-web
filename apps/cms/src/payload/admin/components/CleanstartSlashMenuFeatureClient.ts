'use client';

import { createClientFeature } from '@payloadcms/richtext-lexical/client';

import { SlashMenuPlugin } from './SlashMenuPlugin';

/**
 * Client-side wrapper that mounts <SlashMenuPlugin>. Registers at the
 * `floatingAnchorElem` slot so the popover anchors next to the caret.
 */
export const CleanstartSlashMenuFeatureClient = createClientFeature(() => ({
  plugins: [
    {
      Component: SlashMenuPlugin,
      position: 'floatingAnchorElem',
    },
  ],
}));
