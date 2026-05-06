import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { seoField, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { validateOptionalUrl } from '../lib/url-shape';

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: 'Author', plural: 'Authors' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'acceptingNewBylines', 'updatedAt'],
    group: 'People',
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
    { name: 'photo', type: 'upload', relationTo: 'media' },
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
        { name: 'twitter', type: 'text', validate: validateOptionalUrl },
        { name: 'linkedin', type: 'text', validate: validateOptionalUrl },
        { name: 'github', type: 'text', validate: validateOptionalUrl },
        { name: 'website', type: 'text', validate: validateOptionalUrl },
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
            clientProps: { pathPrefix: '/authors' },
          },
        },
      },
    },
    ...seoSidebarFields({ pathPrefix: '/authors', descriptionSource: 'bioShort' }),
    seoField,
  ],
  hooks: {
    afterChange: [slugChangeRedirectHook('authors')],
  },
  versions: { drafts: true },
  timestamps: true,
};
