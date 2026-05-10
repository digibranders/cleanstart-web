'use client';

import { createClientFeature } from '@payloadcms/richtext-lexical/client';

import { BlockHandlePlugin } from './BlockHandlePlugin';

/**
 * Client-side wrapper that mounts the BlockHandlePlugin into Lexical's
 * floatingAnchorElem slot.
 */
export const CleanstartBlockHandleFeatureClient = createClientFeature(() => ({
  plugins: [
    {
      Component: BlockHandlePlugin,
      position: 'floatingAnchorElem',
    },
  ],
}));
