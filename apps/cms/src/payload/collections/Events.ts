import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { mediaUploadField } from '../fields/media-upload';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
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
    mediaUploadField({ name: 'heroImage', folderHint: 'web/event' }),
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
      validate: (
        value: Date | string | null | undefined,
        { siblingData }: { siblingData?: { startsAt?: Date | string | null } },
      ): true | string => {
        if (value == null || siblingData?.startsAt == null) return true;
        const end = typeof value === 'string' ? Date.parse(value) : value.getTime();
        const start =
          typeof siblingData.startsAt === 'string'
            ? Date.parse(siblingData.startsAt)
            : siblingData.startsAt.getTime();
        if (Number.isNaN(end) || Number.isNaN(start)) return true;
        if (end < start) return 'End time cannot be before start time.';
        return true;
      },
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
    mediaUploadField({
      name: 'agendaPdf',
      folderHint: 'web/event',
      description: 'Agenda PDF (routed to web/event/).',
    }),
    {
      name: 'gallery',
      type: 'array',
      labels: { singular: 'Photo', plural: 'Photos' },
      admin: { description: 'Post-event photos. Surface only after the event ends.' },
      fields: [
        mediaUploadField({ name: 'image', required: true, folderHint: 'web/event' }),
        { name: 'caption', type: 'text' },
      ],
    },
    {
      name: 'permalink',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/PermalinkField.tsx#PermalinkField',
            clientProps: { pathPrefix: '/events' },
          },
        },
      },
    },
    ...seoSidebarFields({ pathPrefix: '/events', descriptionSource: 'abstract' }),
    ...seoFieldsForSidebar('events'),
  ],
  hooks: {
    afterChange: [slugChangeRedirectHook('events')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
