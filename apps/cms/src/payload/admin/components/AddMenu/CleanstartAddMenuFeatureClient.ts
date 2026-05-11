'use client';

import { createClientFeature } from '@payloadcms/richtext-lexical/client';

import { AddMenuToolbarButton } from './AddMenuToolbarButton';

// Custom group at order 10 — same position as the suppressed stock `add` dropdown.
// Using a distinct key (`cs-add-menu`) so it's never merged with other groups.
const addMenuGroup = {
  type: 'buttons' as const,
  items: [
    {
      Component: AddMenuToolbarButton,
      isEnabled: (): boolean => true,
      key: 'cs-add-menu',
      label: 'Insert',
      order: 1,
    },
  ],
  key: 'cs-add-menu',
  order: 10,
};

export const CleanstartAddMenuFeatureClient = createClientFeature(() => ({
  toolbarFixed: { groups: [addMenuGroup] },
}));
