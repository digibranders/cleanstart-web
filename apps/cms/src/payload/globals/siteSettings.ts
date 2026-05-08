import type { GlobalConfig } from 'payload';

import { isAdmin, isAuthenticated } from '../access';

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Site settings',
  admin: { group: 'Globals' },
  access: {
    read: isAuthenticated,
    update: isAdmin,
  },
  versions: { drafts: false, max: 50 },
  fields: [
    { name: 'siteName', type: 'text', defaultValue: 'CleanStart', required: true },
    {
      name: 'baseUrl',
      type: 'text',
      defaultValue: 'https://cleanstart.com',
      required: true,
      admin: { description: 'Used to build absolute URLs for SEO and emails.' },
    },
    {
      name: 'defaultLocale',
      type: 'text',
      defaultValue: 'en-US',
      required: true,
    },
    {
      name: 'organizationTimezone',
      type: 'text',
      defaultValue: 'Asia/Kolkata',
      admin: { description: 'IANA timezone. Default for events / webinars.' },
    },
    {
      type: 'group',
      name: 'listing',
      label: 'Listing pages',
      fields: [
        {
          name: 'pageSize',
          type: 'number',
          defaultValue: 12,
          min: 1,
          max: 100,
        },
        {
          name: 'paginationIndexableDepth',
          type: 'number',
          defaultValue: 3,
          min: 1,
          admin: {
            description:
              'Pagination beyond this depth gets noindex. Beyond ~3 pages of a listing, indexed thin pages hurt SEO.',
          },
        },
      ],
    },
    {
      type: 'group',
      name: 'toc',
      label: 'Table of contents',
      fields: [
        { name: 'minHeadings', type: 'number', defaultValue: 3, min: 0 },
        { name: 'maxDepth', type: 'number', defaultValue: 3, min: 1, max: 6 },
      ],
    },
    {
      type: 'group',
      name: 'leads',
      label: 'Leads & forms',
      fields: [
        {
          name: 'retentionDays',
          type: 'number',
          defaultValue: 365,
          min: 1,
          admin: {
            description:
              'Lead-record retention. Auto-purge cron deletes ip / userAgent after this many days.',
          },
        },
      ],
    },
    {
      type: 'group',
      name: 'analytics',
      label: 'Analytics',
      admin: {
        description:
          'Public-site analytics IDs. Leave blank to disable. Consent mode delays GTM/GA4 firing until the cookie banner returns "accepted".',
      },
      fields: [
        {
          name: 'gtmContainerId',
          type: 'text',
          admin: {
            description: 'Google Tag Manager container, e.g. GTM-XXXXXXX.',
          },
          validate: (value: string | string[] | null | undefined): true | string => {
            if (value == null || (typeof value === 'string' && value.trim().length === 0)) {
              return true;
            }
            if (typeof value !== 'string' || !/^GTM-[A-Z0-9]+$/.test(value.trim())) {
              return 'Expected a GTM container ID like GTM-XXXXXXX.';
            }
            return true;
          },
        },
        {
          name: 'ga4MeasurementId',
          type: 'text',
          admin: {
            description: 'GA4 measurement ID, e.g. G-XXXXXXXXXX.',
          },
          validate: (value: string | string[] | null | undefined): true | string => {
            if (value == null || (typeof value === 'string' && value.trim().length === 0)) {
              return true;
            }
            if (typeof value !== 'string' || !/^G-[A-Z0-9]+$/.test(value.trim())) {
              return 'Expected a GA4 measurement ID like G-XXXXXXXXXX.';
            }
            return true;
          },
        },
        {
          name: 'consentModeEnabled',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description:
              'When on, GA4 / GTM tags fire only after the cookie banner returns "accepted" (Google Consent Mode v2). Required for GDPR compliance.',
          },
        },
      ],
    },
  ],
};
