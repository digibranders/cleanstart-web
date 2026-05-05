import type { GlobalConfig } from 'payload';

import { isAdminOrEditor, isAuthenticated } from '../access';
import { validateOptionalUrl } from '../lib/url-shape';

export const Announcements: GlobalConfig = {
  slug: 'announcements',
  label: 'Announcements',
  admin: {
    group: 'Globals',
    description: 'Optional site-wide banner. Surfaces on every page when active and within the date window.',
  },
  access: {
    read: isAuthenticated,
    update: isAdminOrEditor,
  },
  versions: { drafts: false, max: 50 },
  fields: [
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'message',
      type: 'text',
      required: true,
      admin: { description: 'Banner copy. Keep it short — single line on mobile.' },
    },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'info',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Warning', value: 'warn' },
        { label: 'Promo', value: 'promo' },
      ],
    },
    {
      name: 'startsAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Banner appears no earlier than this. Empty = active immediately when active=true.',
      },
    },
    {
      name: 'endsAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Banner disappears after this. Empty = stays until active is toggled off.',
      },
    },
    {
      type: 'group',
      name: 'cta',
      label: 'Call to action (optional)',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text', validate: validateOptionalUrl },
      ],
    },
    {
      name: 'dismissible',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Visitors can dismiss the banner; choice persisted in localStorage.' },
    },
  ],
};
