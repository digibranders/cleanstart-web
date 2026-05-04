import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { seoField } from '../fields/seo';
import { slugField } from '../fields/slug';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';

export const Jobs: CollectionConfig = {
  slug: 'jobs',
  labels: { singular: 'Job', plural: 'Jobs' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'department', 'employmentType', 'status', '_status', 'updatedAt'],
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
    },
    {
      name: 'department',
      type: 'select',
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
      name: 'locations',
      type: 'relationship',
      relationTo: 'jobLocations',
      hasMany: true,
      admin: {
        description: 'Optional when remote=true. Phase D hook auto-fills "Remote (Global)" sentinel.',
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
        { name: 'max', type: 'number', min: 0 },
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
      name: 'body',
      type: 'richText',
      admin: {
        condition: (_data, sibling) => sibling?.source === 'cms',
      },
    },
    {
      name: 'descriptionPdf',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional JD PDF (routed to web/job/).',
        condition: (_data, sibling) => sibling?.source === 'cms',
      },
    },
    {
      name: 'applyUrl',
      type: 'text',
      admin: {
        description: 'mailto:hire@cleanstart.com is acceptable.',
        condition: (_data, sibling) => sibling?.source === 'cms',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Paused', value: 'paused' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'applicationDeadline',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Defaults to publishedAt + 90 days on first publish (Phase D hook).',
        condition: (_data, sibling) => sibling?.status === 'open',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Default applicationDeadline + 7 days. Auto-close cron uses this.',
        condition: (_data, sibling) => sibling?.status === 'open',
      },
    },
    {
      name: 'closedAt',
      type: 'date',
      access: { update: () => false },
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        condition: (_data, sibling) => sibling?.status === 'closed',
      },
    },
    seoField,
  ],
  hooks: {
    afterChange: [slugChangeRedirectHook('jobs')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
