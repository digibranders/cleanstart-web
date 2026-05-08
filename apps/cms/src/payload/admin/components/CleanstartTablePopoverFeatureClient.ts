'use client';

import {
  createClientFeature,
  toolbarFeatureButtonsGroupWithItems,
} from '@payloadcms/richtext-lexical/client';

import { TableGridPickerPlugin } from './TableGridPickerPlugin';
import { TableToolbarButton } from './TableToolbarButton';

const tableToolbarItem = {
  Component: TableToolbarButton,
  isEnabled: (): boolean => true,
  key: 'cs-table',
  label: 'Table (inline)',
  order: 5,
};

const toolbarGroups = [
  toolbarFeatureButtonsGroupWithItems([tableToolbarItem]),
];

export const CleanstartTablePopoverFeatureClient = createClientFeature(
  () => ({
    plugins: [
      {
        Component: TableGridPickerPlugin,
        position: 'floatingAnchorElem',
      },
    ],
    toolbarFixed: { groups: toolbarGroups },
    toolbarInline: { groups: toolbarGroups },
  }),
);
