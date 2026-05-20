import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { ROUTE_PREFIX } from '../lib/route-prefixes';
import { mediaUploadField } from '../fields/media-upload';
import { displayPublishedAtField } from '../fields/display-published-at';
import { publishedAtField } from '../fields/published-at';
import { schemaAddonsField } from '../fields/schema-addons';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { displayPublishedAtAuditHook } from '../hooks/display-published-at-audit';
import { displayPublishedAtBackfillHook } from '../hooks/display-published-at-backfill';
import { eventStatusTimestampsHook } from '../hooks/event-status-timestamps';
import { firstPublishHook } from '../hooks/first-publish';
import { schemaOverrideAuditHook } from '../hooks/schema-override-audit';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

export const Webinars: CollectionConfig = {
  slug: 'webinars',
  labels: { singular: 'Webinar', plural: 'Webinars' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'webinarType', 'region', 'startsAt', '_status', 'updatedAt'],
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
    mediaUploadField({ name: 'heroImage', folderHint: 'web/webinar' }),
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
      defaultValue: 'global',
      options: [
        { label: 'North America', value: 'north-america' },
        { label: 'Asia & MEA', value: 'asia-mea' },
        { label: 'EMEA', value: 'emea' },
        { label: 'Global', value: 'global' },
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
          'Drives the Event JSON-LD eventStatus. Switching to Postponed / Cancelled is required so search engines stop showing the webinar as still happening.',
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
          'Original start date before this webinar was rescheduled. Auto-captured when you change startsAt while eventStatus is Postponed; emitted as Schema.org Event.previousStartDate.',
        position: 'sidebar',
        condition: (_data, sibling) => sibling?.eventStatus === 'postponed',
      },
    },
    mediaUploadField({
      name: 'pdf',
      folderHint: 'web/webinar',
      description: 'Slides PDF (routed to web/webinar/).',
    }),
    {
      name: 'recordingUrl',
      type: 'text',
      admin: {
        description: 'Post-event recording. Surfaces after endsAt < now.',
      },
      hooks: { beforeValidate: [normalizeOptionalUrlHook] },
      validate: validateOptionalUrl,
    },
    {
      name: 'slidesUrl',
      type: 'text',
      admin: {
        description: 'External slides link. Use the pdf field instead when hosting on R2.',
      },
      hooks: { beforeValidate: [normalizeOptionalUrlHook] },
      validate: validateOptionalUrl,
    },
    {
      name: 'permalink',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/PermalinkField.tsx#PermalinkField',
            clientProps: { pathPrefix: ROUTE_PREFIX.webinars },
          },
        },
      },
    },
    schemaAddonsField,
    publishedAtField,
    displayPublishedAtField,
    ...seoSidebarFields({ pathPrefix: ROUTE_PREFIX.webinars, descriptionSource: 'abstract' }),
    ...seoFieldsForSidebar('webinars'),
  ],
  hooks: {
    beforeChange: [firstPublishHook(), displayPublishedAtBackfillHook, eventStatusTimestampsHook],
    afterChange: [
      slugChangeRedirectHook('webinars'),
      schemaOverrideAuditHook('webinars'),
      displayPublishedAtAuditHook('webinars'),
    ],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
