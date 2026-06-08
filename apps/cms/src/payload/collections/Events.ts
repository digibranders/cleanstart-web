import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { ROUTE_PREFIX } from '../lib/route-prefixes';
import { mediaUploadField } from '../fields/media-upload';
import { publishedAtField } from '../fields/published-at';
import { schemaAddonsField } from '../fields/schema-addons';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { eventStatusTimestampsHook } from '../hooks/event-status-timestamps';
import { firstPublishHook } from '../hooks/first-publish';
import { normalizeLexicalHook } from '../hooks/normalize-lexical';
import { schemaOverrideAuditHook } from '../hooks/schema-override-audit';
import {
  searchSyncAfterChangeHook,
  searchSyncAfterDeleteHook,
} from '../hooks/search-sync';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'venue', 'startsAt', 'registrationMode', '_status', 'updatedAt'],
    group: 'Content',
    components: {
      edit: docStatusBarEditConfig({ showStats: false, showPublishedAt: true }),
    },
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    contentTitleField,
    slugField({ source: 'title' }),
    { name: 'venue', type: 'text', required: true },
    {
      name: 'country',
      type: 'select',
      options: [
        { label: 'India', value: 'india' },
        { label: 'United States', value: 'united-states' },
        { label: 'United Arab Emirates', value: 'uae' },
        { label: 'Thailand', value: 'thailand' },
      ],
      admin: {
        description:
          'Country where the event is held. Powers the country filter on the /events listing page — set it to match the venue.',
      },
    },
    { name: 'abstract', type: 'textarea' },
    mediaUploadField({ name: 'heroImage', folderHint: 'web/event' }),
    { name: 'body', type: 'richText' },
    {
      name: 'startsAt',
      type: 'date',
      required: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        // Custom calendar so it matches `endsAt` (which needs a dynamic
        // min-date the stock picker can't express).
        components: {
          Field: '@/payload/admin/components/fields/DateField.tsx#DateField',
        },
      },
    },
    {
      name: 'endsAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        // `minFromField: 'startsAt'` greys out any date before the start in
        // the calendar, so an end-before-start can't be selected. The
        // `validate` below is the server-side backstop.
        components: {
          Field: {
            path: '@/payload/admin/components/fields/DateField.tsx#DateField',
            clientProps: { minFromField: 'startsAt' },
          },
        },
      },
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
    {
      name: 'ctaLabel',
      type: 'text',
      admin: {
        description:
          'Optional custom label for the registration CTA button. Defaults to "Register" when blank. Examples: "Join the Community", "RSVP", "Save Your Seat".',
      },
    },
    {
      name: 'postEventCta',
      type: 'group',
      admin: {
        description:
          'Optional CTA shown on the detail page after the event has ended (startsAt is in the past). The registration button is hidden automatically — use this for "View Photos", "Watch Recording", "View Slides", etc.',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Enable to show a CTA on the detail page after the event ends.' },
        },
        {
          name: 'label',
          type: 'text',
          admin: {
            description: 'Button label, e.g. "Watch Recording".',
            condition: (_data, sibling) => sibling?.enabled === true,
          },
          validate: (
            value: string | string[] | null | undefined,
            { siblingData }: { siblingData?: { enabled?: boolean } },
          ): true | string => {
            if (!siblingData?.enabled) return true;
            if (typeof value !== 'string' || value.trim().length === 0) {
              return 'Label is required when the post-event CTA is enabled.';
            }
            return true;
          },
        },
        {
          name: 'url',
          type: 'text',
          admin: {
            description: 'Destination URL for the post-event CTA.',
            condition: (_data, sibling) => sibling?.enabled === true,
          },
          validate: (
            value: string | string[] | null | undefined,
            { siblingData }: { siblingData?: { enabled?: boolean } },
          ): true | string => {
            if (!siblingData?.enabled) return true;
            if (typeof value !== 'string' || value.trim().length === 0) {
              return 'URL is required when the post-event CTA is enabled.';
            }
            return true;
          },
        },
      ],
    },
    {
      name: 'eventStatus',
      type: 'select',
      defaultValue: 'scheduled',
      required: true,
      options: [
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Postponed', value: 'postponed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Drives the Event JSON-LD eventStatus. Switching to Postponed / Cancelled is required so search engines stop showing the event as still happening.',
      },
    },
    {
      name: 'cancelledAt',
      type: 'date',
      access: { update: () => false },
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Auto-stamped when eventStatus flips to Cancelled.',
        position: 'sidebar',
        condition: (_data, sibling) => sibling?.eventStatus === 'cancelled',
      },
    },
    {
      name: 'previousStartDate',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description:
          'Original start date before this event was rescheduled. Auto-captured when you change startsAt while eventStatus is Postponed; emitted as Schema.org Event.previousStartDate.',
        position: 'sidebar',
        condition: (_data, sibling) => sibling?.eventStatus === 'postponed',
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
            clientProps: { pathPrefix: ROUTE_PREFIX.events },
          },
        },
      },
    },
    schemaAddonsField,
    publishedAtField,
    ...seoSidebarFields({ pathPrefix: ROUTE_PREFIX.events, descriptionSource: 'abstract' }),
    ...seoFieldsForSidebar('events'),
  ],
  hooks: {
    beforeChange: [normalizeLexicalHook(), firstPublishHook(), eventStatusTimestampsHook],
    afterChange: [
      slugChangeRedirectHook('events'),
      schemaOverrideAuditHook('events'),
      searchSyncAfterChangeHook('events'),
      webhooksPublishAfterChangeHook('events'),
      indexNowPublishAfterChangeHook('events'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('events')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
