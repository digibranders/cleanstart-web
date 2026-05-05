import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { seoField } from '../fields/seo';
import { slugField } from '../fields/slug';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { validateOptionalUrl } from '../lib/url-shape';

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
        description: 'Required when registrationMode is External URL.',
        condition: (_data, sibling) => sibling?.registrationMode === 'external',
      },
      validate: (
        value: string | string[] | null | undefined,
        { siblingData }: { siblingData?: { registrationMode?: string } },
      ): true | string => {
        if (siblingData?.registrationMode !== 'external') return true;
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Registration URL is required when registration mode is External URL.';
        }
        return true;
      },
    },
    {
      name: 'registrationForm',
      type: 'relationship',
      relationTo: 'forms',
      admin: {
        description: 'Required when registrationMode is In-house form.',
        condition: (_data, sibling) => sibling?.registrationMode === 'internal',
      },
      validate: (
        value: unknown,
        { siblingData }: { siblingData?: { registrationMode?: string } },
      ): true | string => {
        if (siblingData?.registrationMode !== 'internal') return true;
        if (value == null) {
          return 'Registration form is required when registration mode is In-house form.';
        }
        return true;
      },
    },
    {
      name: 'attendeesCap',
      type: 'number',
      min: 1,
      admin: {
        condition: (_data, sibling) => sibling?.registrationMode === 'internal',
      },
    },
    {
      name: 'speakers',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
      filterOptions: {
        acceptingNewBylines: { not_equals: false },
      },
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
      validate: validateOptionalUrl,
    },
    {
      name: 'slidesUrl',
      type: 'text',
      admin: {
        description: 'External slides link. Use the pdf field instead when hosting on R2.',
      },
      validate: validateOptionalUrl,
    },
    seoField,
  ],
  hooks: {
    afterChange: [slugChangeRedirectHook('webinars')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
