'use client';

import {
  createClientFeature,
  toolbarFeatureButtonsGroupWithItems,
} from '@payloadcms/richtext-lexical/client';

import { EmbedNode } from './EmbedNode';
import { EmbedPlugin } from './EmbedPlugin';
import { EmbedToolbarButton } from './EmbedToolbarButton';

const embedToolbarItem = {
  Component: EmbedToolbarButton,
  isEnabled: (): boolean => true,
  key: 'cs-embed',
  label: 'Embed',
  order: 6,
};

const toolbarGroups = [toolbarFeatureButtonsGroupWithItems([embedToolbarItem])];

/**
 * Client-side embed feature. Mounts EmbedPlugin at the floatingAnchorElem
 * slot and adds a single toolbar button (cs-embed) to the fixed toolbar.
 * The inline toolbar intentionally excludes the embed button — embeds are
 * block-level and cannot wrap selected text.
 */
export const CleanstartEmbedFeatureClient = createClientFeature(() => ({
  nodes: [EmbedNode],
  plugins: [
    {
      Component: EmbedPlugin,
      position: 'floatingAnchorElem' as const,
    },
  ],
  toolbarFixed: { groups: toolbarGroups },
}));
