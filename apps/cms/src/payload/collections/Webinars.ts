import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { seoField } from '../fields/seo';
import { slugField } from '../fields/slug';

export const Webinars: CollectionConfig = {
  slug: 'webinars',
  labels: { singular: 'Webinar', plural: 'Webinars' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'webinarType', 'region', 'startsAt', '_status', 'updatedAt'],
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
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'abstract', type: 'textarea' },
    { name: 'body', type: 'richText' },
    {
      name: 'webinarType',
      type: 'select',
      required: true,
      defaultValue: 'live',
      options: [
        { label: 'Live', value: 'live' },
        { label: 'On-demand', value: 'on-demand' },
        { label: 'Panel', value: 'panel' },
        { label: 'Demo', value: 'demo' },
      ],
    },
    {
      name: 'region',
      type: 'select',
      required: true,
      defaultValue: 'Global',
      options: [
        { label: 'Americas', value: 'Americas' },
        { label: 'EMEA', value: 'EMEA' },
        { label: 'APAC', value: 'APAC' },
        { label: 'Global', value: 'Global' },
      ],
    },
    {
      name: 'startsAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        condition: (_data, sibling) => sibling?.webinarType !== 'on-demand',
      },
    },
    {
      name: 'endsAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        condition: (_data, sibling) => sibling?.webinarType !== 'on-demand',
      },
    },
    {
      name: 'timezone',
      type: 'text',
      admin: {
        description: 'Falls back to siteSettings.organizationTimezone.',
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
      name: 'speakers',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
    },
    {
      name: 'pdf',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Slides PDF (routed to web/webinar/).' },
    },
    {
      name: 'recordingUrl',
      type: 'text',
      admin: {
        description: 'Post-event recording. Surfaces after endsAt < now.',
      },
    },
    {
      name: 'slidesUrl',
      type: 'text',
      admin: {
        description: 'External slides link. Use the pdf field instead when hosting on R2.',
      },
    },
    seoField,
  ],
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
