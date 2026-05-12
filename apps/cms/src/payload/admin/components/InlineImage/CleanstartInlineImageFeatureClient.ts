'use client';

import { createClientFeature } from '@payloadcms/richtext-lexical/client';

import { InlineImagePlugin } from './InlineImagePlugin';

/**
 * Client-side wrapper that mounts `<InlineImagePlugin>` at the
 * `floatingAnchorElem` slot so it has the same lifecycle as the
 * other Cleanstart plugins (slash menu, link popover, table popover).
 */
export const CleanstartInlineImageFeatureClient = createClientFeature(() => ({
  plugins: [
    {
      Component: InlineImagePlugin,
      position: 'floatingAnchorElem',
    },
  ],
}));
