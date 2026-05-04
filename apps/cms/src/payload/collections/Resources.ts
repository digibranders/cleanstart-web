import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { seoField } from '../fields/seo';
import { slugField } from '../fields/slug';

export const Resources: CollectionConfig = {
  slug: 'resources',
  labels: { singular: 'Resource', plural: 'Resources' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'gated', 'accessLevel', '_status', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ source: 'title' }),
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Whitepaper', value: 'whitepaper' },
        { label: 'Report', value: 'report' },
        { label: 'Brief', value: 'brief' },
        { label: 'Datasheet', value: 'datasheet' },
        { label: 'Case study', value: 'case-study' },
      ],
    },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'summary', type: 'textarea' },
    { name: 'body', type: 'richText' },
    {
      name: 'asset',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'PDF or other downloadable. Routed to web/resource/.' },
    },
    {
      name: 'gated',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'When enabled, the asset download requires a form submission. Sets accessLevel to lead-gated by default.',
      },
    },
    {
      name: 'gateForm',
      type: 'relationship',
      relationTo: 'forms',
      admin: {
        description: 'Form the visitor fills to unlock the download.',
        condition: (_data, sibling) => sibling?.gated === true,
      },
    },
    {
      name: 'accessLevel',
      type: 'select',
      defaultValue: 'public',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Lead-gated (form unlocks)', value: 'lead-gated' },
        { label: 'Customer-only', value: 'customer-only' },
      ],
      admin: {
        condition: (_data, sibling) => sibling?.gated === true,
      },
    },
    {
      name: 'downloadCount',
      type: 'number',
      defaultValue: 0,
      access: { update: () => false },
      admin: {
        readOnly: true,
        description: 'Incremented on every successful download (Phase E hook).',
        position: 'sidebar',
        condition: (_data, sibling) => sibling?.gated === true,
      },
    },
    seoField,
  ],
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
