import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { mediaUploadField } from '../fields/media-upload';
import { schemaHealthListField, seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import {
  searchSyncAfterChangeHook,
  searchSyncAfterDeleteHook,
} from '../hooks/search-sync';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import { normalizeLexicalHook } from '../hooks/normalize-lexical';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';
import { normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: 'Author', plural: 'Authors' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'acceptingNewBylines', 'schemaHealth', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField({ source: 'name' }),
    mediaUploadField({ name: 'photo', folderHint: 'web/author' }),
    { name: 'role', type: 'text', admin: { description: 'Job title shown on the byline + Person JSON-LD.' } },
    { name: 'location', type: 'text' },
    { name: 'bioShort', type: 'textarea', admin: { description: 'One-line bio for cards and SERP snippets.' } },
    {
      name: 'bioLong',
      type: 'richText',
      admin: { description: 'Full bio shown on /author/[slug].' },
    },
    {
      name: 'topicAreas',
      type: 'array',
      labels: { singular: 'Topic', plural: 'Topic areas' },
      admin: {
        description:
          'Topics this author covers. Powers Person JSON-LD knowsAbout and "more from this author on X" suggestions.',
      },
      fields: [{ name: 'topic', type: 'text', required: true }],
    },
    {
      type: 'group',
      name: 'social',
      label: 'Social',
      fields: [
        // `beforeValidate` normalises bare domains (`cleanstart.com`) to
        // `https://cleanstart.com` so the optional-URL validator stops
        // blocking publish on a value editors think of as a valid URL.
        { name: 'twitter',  type: 'text', hooks: { beforeValidate: [normalizeOptionalUrlHook] }, validate: validateOptionalUrl },
        { name: 'linkedin', type: 'text', hooks: { beforeValidate: [normalizeOptionalUrlHook] }, validate: validateOptionalUrl },
        { name: 'github',   type: 'text', hooks: { beforeValidate: [normalizeOptionalUrlHook] }, validate: validateOptionalUrl },
        { name: 'website',  type: 'text', hooks: { beforeValidate: [normalizeOptionalUrlHook] }, validate: validateOptionalUrl },
        { name: 'email', type: 'email' },
      ],
    },
    {
      type: 'array',
      name: 'education',
      labels: { singular: 'Education entry', plural: 'Education' },
      fields: [
        { name: 'institution', type: 'text', required: true },
        { name: 'degree', type: 'text' },
        { name: 'year', type: 'number', min: 1900, max: 2100 },
      ],
    },
    {
      type: 'array',
      name: 'experience',
      labels: { singular: 'Role', plural: 'Experience' },
      fields: [
        { name: 'company', type: 'text', required: true },
        { name: 'role', type: 'text' },
        { name: 'fromYear', type: 'number', min: 1900, max: 2100 },
        { name: 'toYear', type: 'number', min: 1900, max: 2100 },
      ],
    },
    {
      type: 'array',
      name: 'skills',
      labels: { singular: 'Skill', plural: 'Skills' },
      fields: [{ name: 'skill', type: 'text', required: true }],
    },
    {
      type: 'array',
      name: 'awards',
      labels: { singular: 'Award', plural: 'Awards' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'issuer', type: 'text' },
        { name: 'year', type: 'number', min: 1900, max: 2100 },
      ],
    },
    {
      // Read-only backstop populated by the Webflow ETL with the
      // editor's original rich-text bio sub-fields (Education,
      // Experience, Core Skills & Expertise, Awards & Recognition).
      // The structured arrays above are the source of truth for
      // public render + JSON-LD; this field exists so the author
      // can copy from their original Webflow text while filling the
      // structured rows post-migration.
      name: 'legacyBio',
      type: 'json',
      access: { update: () => false },
      admin: { hidden: true, readOnly: true },
    },
    {
      // Sidebar-rendered viewer for `legacyBio`. Renders the original
      // Webflow bio fragments alongside the form so the editor can
      // copy → paste into the structured arrays. Auto-hides itself
      // when `legacyBio` is null (i.e. for any author created after
      // the Webflow import).
      name: 'legacyBioViewer',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/payload/admin/components/LegacyBioViewer.tsx#LegacyBioViewer',
        },
      },
    },
    {
      name: 'acceptingNewBylines',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Toggle off to hide this author from the byline picker on new drafts. Existing bylines stay intact.',
        position: 'sidebar',
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
            clientProps: { pathPrefix: '/author' },
          },
        },
      },
    },
    {
      name: 'credibility',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/payload/admin/components/AuthorCredibilityField.tsx#AuthorCredibilityField',
        },
      },
    },
    ...seoSidebarFields({
      pathPrefix: '/author',
      titleSource: 'name',
      descriptionSource: 'bioShort',
    }),
    ...seoFieldsForSidebar('authors'),
    schemaHealthListField('authors'),
  ],
  hooks: {
    beforeChange: [normalizeLexicalHook({ fields: ['bioLong'] })],
    afterChange: [
      slugChangeRedirectHook('authors'),
      searchSyncAfterChangeHook('authors'),
      webhooksPublishAfterChangeHook('authors'),
      indexNowPublishAfterChangeHook('authors'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('authors')],
  },
  versions: { drafts: true },
  timestamps: true,
};
