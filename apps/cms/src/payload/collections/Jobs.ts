import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload';

import { isAdminEditorOrHr, publishedOrAuthenticated } from '../access';
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

/**
 * Stamps `closedAt` when `hiringStatus` transitions to `'closed'`.
 * Runs in beforeChange so the field access (`update: () => false`) is
 * bypassed via the hook's data mutation before Payload's access check
 * evaluates the field diff.
 */
const stampClosedAtHook: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const next = data as Record<string, unknown>;
  const prev = originalDoc as Record<string, unknown> | undefined;
  if (next.hiringStatus === 'closed' && prev?.hiringStatus !== 'closed' && next.closedAt == null) {
    next.closedAt = new Date().toISOString();
  }
  return next;
};

export const Jobs: CollectionConfig = {
  slug: 'jobs',
  labels: { singular: 'Job', plural: 'Jobs' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'title',
      'department',
      'employmentType',
      'hiringStatus',
      '_status',
      'updatedAt',
    ],
    group: 'Content',
    components: {
      edit: docStatusBarEditConfig({ showStats: false, showPublishedAt: true, showPurge: true }),
    },
  },
  access: {
    read: publishedOrAuthenticated,
    create: isAdminEditorOrHr,
    update: isAdminEditorOrHr,
    delete: isAdminEditorOrHr,
  },
  fields: [
    contentTitleField,
    slugField({ source: 'title' }),
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'cms',
      options: [
        { label: 'CMS-native', value: 'cms' },
        { label: 'External ATS', value: 'ats' },
      ],
    },
    {
      name: 'atsUrl',
      type: 'text',
      admin: {
        description: 'Deep link into the external ATS. Required when source=ats.',
        condition: (_data, sibling) => sibling?.source === 'ats',
      },
      hooks: { beforeValidate: [normalizeOptionalUrlHook] },
      validate: (
        value: string | string[] | null | undefined,
        { siblingData }: { siblingData?: { source?: string } },
      ): true | string => {
        if (siblingData?.source !== 'ats') return true;
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'ATS URL is required when source is External ATS.';
        }
        return validateOptionalUrl(value);
      },
    },
    {
      name: 'department',
      type: 'select',
      admin: {
        description:
          'Legacy enum — superseded by the Department relationship below. Kept during the taxonomy transition; removed once apps/web reads the relationship.',
      },
      options: [
        { label: 'Engineering', value: 'engineering' },
        { label: 'Sales', value: 'sales' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Customer Success', value: 'customer-success' },
        { label: 'Operations', value: 'operations' },
        { label: 'Finance', value: 'finance' },
        { label: 'Legal', value: 'legal' },
        { label: 'People', value: 'people' },
      ],
    },
    {
      name: 'departmentRef',
      type: 'relationship',
      relationTo: 'departments',
      admin: {
        description:
          'Department taxonomy reference. Seeded/backfilled from the legacy `department` enum; editors manage the list under Taxonomies → Departments.',
      },
    },
    {
      name: 'employmentType',
      type: 'select',
      defaultValue: 'full-time',
      options: [
        { label: 'Full-time', value: 'full-time' },
        { label: 'Part-time', value: 'part-time' },
        { label: 'Contract', value: 'contract' },
        { label: 'Internship', value: 'internship' },
      ],
    },
    {
      name: 'experienceLevel',
      type: 'select',
      options: [
        { label: 'Entry', value: 'entry' },
        { label: 'Mid', value: 'mid' },
        { label: 'Senior', value: 'senior' },
        { label: 'Staff', value: 'staff' },
        { label: 'Principal', value: 'principal' },
      ],
    },
    {
      name: 'experienceRange',
      type: 'text',
      admin: {
        description:
          'Human-readable experience range shown on the careers site (e.g. "3-10 Years"). Backfilled from the original Webflow data; experienceLevel is the structured bucket derived from it.',
      },
    },
    {
      name: 'locations',
      type: 'relationship',
      relationTo: 'jobLocations',
      hasMany: true,
      admin: {
        description:
          'Optional when remote=true. Renderers can fall back to "Remote (Global)" when this is empty and remote is on.',
      },
    },
    {
      name: 'remote',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      type: 'group',
      name: 'salaryRange',
      label: 'Salary range (optional)',
      fields: [
        { name: 'min', type: 'number', min: 0 },
        {
          name: 'max',
          type: 'number',
          min: 0,
          validate: (
            value: number | number[] | null | undefined,
            { siblingData }: { siblingData?: { min?: number | null } },
          ): true | string => {
            if (typeof value !== 'number') return true;
            const min = typeof siblingData?.min === 'number' ? siblingData.min : null;
            if (min != null && value < min) {
              return 'Maximum salary cannot be lower than minimum.';
            }
            return true;
          },
        },
        {
          name: 'currency',
          type: 'select',
          defaultValue: 'USD',
          options: [
            { label: 'USD', value: 'USD' },
            { label: 'EUR', value: 'EUR' },
            { label: 'GBP', value: 'GBP' },
            { label: 'INR', value: 'INR' },
          ],
        },
      ],
    },
    {
      name: 'abstract',
      type: 'textarea',
      admin: {
        description:
          'Short summary shown on listing cards and drives the SEO description fallback. Keep under 160 characters.',
        condition: (_data, sibling) => sibling?.source === 'cms',
      },
    },
    {
      name: 'body',
      type: 'richText',
      admin: {
        condition: (_data, sibling) => sibling?.source === 'cms',
      },
    },
    mediaUploadField({
      name: 'descriptionPdf',
      folderHint: 'web/job',
      accept: ['application/pdf'],
      description: 'Optional JD PDF (routed to web/job/).',
      condition: (_data, sibling) => (sibling as { source?: string } | undefined)?.source === 'cms',
    }),
    {
      name: 'applyUrl',
      type: 'text',
      admin: {
        description: 'mailto:hire@cleanstart.com is acceptable.',
        condition: (_data, sibling) => sibling?.source === 'cms',
      },
      hooks: { beforeValidate: [normalizeOptionalUrlHook] },
      validate: validateOptionalUrl,
    },
    {
      name: 'hiringStatus',
      type: 'select',
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Paused', value: 'paused' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Hiring lifecycle. Distinct from Payload _status (draft/published).',
      },
    },
    {
      name: 'applicationDeadline',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'When applications close. Editors set this when posting.',
        condition: (_data, sibling) => sibling?.hiringStatus === 'open',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description:
          'When the listing should auto-close. Not yet enforced — update hiringStatus manually when the deadline passes.',
        condition: (_data, sibling) => sibling?.hiringStatus === 'open',
      },
    },
    {
      name: 'closedAt',
      type: 'date',
      access: { update: () => false },
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        condition: (_data, sibling) => sibling?.hiringStatus === 'closed',
      },
    },
    {
      name: 'applications',
      type: 'join',
      collection: 'career-applications',
      on: 'job',
      label: 'Applications',
      admin: {
        allowCreate: false,
        defaultColumns: ['firstName', 'lastName', 'email', 'emailDelivery', 'createdAt'],
        description:
          'Applications submitted for this job (read-only). Open one to download the resume.',
      },
    },
    {
      name: 'permalink',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/PermalinkField.tsx#PermalinkField',
            clientProps: { pathPrefix: ROUTE_PREFIX.jobs },
          },
        },
      },
    },
    schemaAddonsField,
    publishedAtField,
    displayPublishedAtField,
    ...seoSidebarFields({ pathPrefix: ROUTE_PREFIX.jobs, descriptionSource: 'abstract' }),
    ...seoFieldsForSidebar('jobs'),
  ],
  hooks: {
    beforeChange: [
      normalizeLexicalHook(),
      firstPublishHook(),
      displayPublishedAtBackfillHook,
      stampClosedAtHook,
    ],
    afterChange: [
      slugChangeRedirectHook('jobs'),
      schemaOverrideAuditHook('jobs'),
      displayPublishedAtAuditHook('jobs'),
      searchSyncAfterChangeHook('jobs'),
      webhooksPublishAfterChangeHook('jobs'),
      indexNowPublishAfterChangeHook('jobs'),
      revalidateWebPublishAfterChangeHook('jobs'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('jobs'), revalidateWebAfterDeleteHook('jobs')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
