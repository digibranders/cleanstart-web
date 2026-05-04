import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { seoField } from '../fields/seo';
import { slugField } from '../fields/slug';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'venue', 'startsAt', 'registrationMode', '_status', 'updatedAt'],
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
    { name: 'venue', type: 'text', required: true },
    { name: 'abstract', type: 'textarea' },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'body', type: 'richText' },
    {
      name: 'startsAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'endsAt',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'timezone',
      type: 'text',
      admin: {
        description:
          'IANA timezone string (e.g. Asia/Kolkata). Falls back to siteSettings.organizationTimezone.',
      },
    },
    {
      name: 'customDateLabel',
      type: 'text',
      admin: {
        description: 'Override for vague dates ("Q3 2026", "Spring 2027").',
      },
    },
    {
      name: 'registrationMode',
      type: 'select',
      required: true,
      defaultValue: 'external',
      options: [
        { label: 'In-house form', value: 'internal' },
        { label: 'External URL', value: 'external' },
      ],
      admin: { description: 'Per-record switchable per locked schema decision.' },
    },
    {
      name: 'registrationUrl',
      type: 'text',
      admin: {
        condition: (_data, sibling) => sibling?.registrationMode === 'external',
      },
    },
    {
      name: 'registrationForm',
      type: 'relationship',
      relationTo: 'forms',
      admin: {
        condition: (_data, sibling) => sibling?.registrationMode === 'internal',
      },
    },
    {
      name: 'attendeesCap',
      type: 'number',
      min: 0,
      admin: {
        condition: (_data, sibling) => sibling?.registrationMode === 'internal',
      },
    },
    {
      name: 'agendaPdf',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Agenda PDF (routed to web/event/).' },
    },
    {
      name: 'gallery',
      type: 'array',
      labels: { singular: 'Photo', plural: 'Photos' },
      admin: { description: 'Post-event photos. Surface only after the event ends.' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    seoField,
  ],
  hooks: {
    afterChange: [slugChangeRedirectHook('events')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
