import type { CollectionConfig } from 'payload';

import { isAdminEditorOrEvents, publishedOrAuthenticated } from '../access';

const validateEndsAfterStarts = (
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
};
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { displayPublishedAtField } from '../fields/display-published-at';
import { mediaUploadField } from '../fields/media-upload';
import { publishedAtField } from '../fields/published-at';
import { schemaAddonsField } from '../fields/schema-addons';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { displayPublishedAtAuditHook } from '../hooks/display-published-at-audit';
import { displayPublishedAtBackfillHook } from '../hooks/display-published-at-backfill';
import { eventStatusTimestampsHook } from '../hooks/event-status-timestamps';
import { firstPublishHook } from '../hooks/first-publish';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import { normalizeLexicalHook } from '../hooks/normalize-lexical';
import {
  revalidateWebAfterDeleteHook,
  revalidateWebPublishAfterChangeHook,
} from '../hooks/revalidate-web-publish';
import { schemaOverrideAuditHook } from '../hooks/schema-override-audit';
import { searchSyncAfterChangeHook, searchSyncAfterDeleteHook } from '../hooks/search-sync';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';
import { ROUTE_PREFIX } from '../lib/route-prefixes';
import { normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

export const Webinars: CollectionConfig = {
  slug: 'webinars',
  labels: { singular: 'Webinar', plural: 'Webinars' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'webinarType', 'region', 'startsAt', '_status', 'updatedAt'],
    group: 'Content',
    components: {
      edit: docStatusBarEditConfig({ showStats: false, showPublishedAt: true, showPurge: true }),
    },
  },
  access: {
    read: publishedOrAuthenticated,
    create: isAdminEditorOrEvents,
    update: isAdminEditorOrEvents,
    delete: isAdminEditorOrEvents,
  },
  fields: [
    contentTitleField,
    slugField({ source: 'title' }),
    mediaUploadField({
      name: 'heroImage',
      folderHint: 'web/webinar',
      guidance: {
        dimensions: '1600 × 800 px',
        aspectRatio: '2:1 (wide landscape)',
        note: 'Cover for the listing card and the detail hero. Cropped to fill — keep the subject centered. Min 1200 px wide.',
      },
    }),
    { name: 'abstract', type: 'textarea' },
    { name: 'body', type: 'richText' },
    {
      name: 'webinarType',
      type: 'select',
      required: true,
      defaultValue: 'live',
      admin: {
        description:
          'Legacy enum — superseded by the Webinar type relationship below. Kept during the taxonomy transition; removed once apps/web reads the relationship.',
      },
      options: [
        { label: 'Live', value: 'live' },
        { label: 'On-demand', value: 'on-demand' },
        { label: 'Panel', value: 'panel' },
        { label: 'Demo', value: 'demo' },
      ],
    },
    {
      name: 'webinarTypeRef',
      type: 'relationship',
      relationTo: 'webinarTypes',
      admin: {
        description:
          'Webinar type taxonomy reference. Seeded/backfilled from the legacy `webinarType` enum; editors manage the list under Taxonomies → Webinar types.',
      },
    },
    {
      name: 'region',
      type: 'select',
      required: true,
      defaultValue: 'global',
      admin: {
        description:
          'Legacy enum — superseded by the Region relationship below. Kept during the taxonomy transition; removed once apps/web reads the relationship.',
      },
      options: [
        { label: 'North America', value: 'north-america' },
        { label: 'Asia & MEA', value: 'asia-mea' },
        { label: 'EMEA', value: 'emea' },
        { label: 'Global', value: 'global' },
      ],
    },
    {
      name: 'regionRef',
      type: 'relationship',
      relationTo: 'regions',
      admin: {
        description:
          'Region taxonomy reference (shared with News). Seeded/backfilled from the legacy `region` enum; editors manage the list under Taxonomies → Regions.',
      },
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
      validate: validateEndsAfterStarts,
    },
    {
      name: 'timezone',
      type: 'text',
      admin: {
        description: 'IANA timezone string (e.g. Asia/Kolkata).',
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
        { siblingData }: { siblingData?: { registrationMode?: string; webinarType?: string } },
      ): true | string => {
        if (siblingData?.webinarType === 'on-demand') return true;
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
        { siblingData }: { siblingData?: { registrationMode?: string; webinarType?: string } },
      ): true | string => {
        if (siblingData?.webinarType === 'on-demand') return true;
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
      accept: ['application/pdf'],
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
    beforeChange: [
      normalizeLexicalHook(),
      firstPublishHook(),
      displayPublishedAtBackfillHook,
      eventStatusTimestampsHook,
    ],
    afterChange: [
      slugChangeRedirectHook('webinars'),
      schemaOverrideAuditHook('webinars'),
      displayPublishedAtAuditHook('webinars'),
      searchSyncAfterChangeHook('webinars'),
      webhooksPublishAfterChangeHook('webinars'),
      indexNowPublishAfterChangeHook('webinars'),
      revalidateWebPublishAfterChangeHook('webinars'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('webinars'), revalidateWebAfterDeleteHook('webinars')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
