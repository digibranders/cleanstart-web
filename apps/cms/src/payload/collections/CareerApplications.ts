import type { CollectionConfig } from 'payload';

import { isAdmin, isAdminOrEditor } from '../access';
import { careersApplyEndpoint, careersApplyOptionsEndpoint } from '../endpoints/careers-apply';
import { normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

/**
 * Career applications — append-only. Created exclusively by the careers-apply
 * endpoint (overrideAccess); the public never POSTs here directly. Entirely
 * separate from the leads/HubSpot pipeline: no crmHandlers, no HubSpot sync.
 * PII (applicant fields, ip, userAgent) is purged by the retention cron, which
 * also deletes the linked resume file.
 */
export const CareerApplications: CollectionConfig = {
  slug: 'career-applications',
  labels: { singular: 'Application', plural: 'Applications' },
  admin: {
    group: 'Recruiting',
    useAsTitle: 'email',
    defaultColumns: ['job', 'firstName', 'lastName', 'email', 'emailDelivery', 'createdAt'],
    description: 'Job applications (append-only). Resumes are stored privately and emailed to HR.',
  },
  access: {
    read: isAdminOrEditor,
    create: isAdmin,
    update: () => false,
    delete: isAdmin,
  },
  endpoints: [careersApplyEndpoint, careersApplyOptionsEndpoint],
  fields: [
    { name: 'job', type: 'relationship', relationTo: 'jobs', required: true },
    {
      name: 'jobTitleSnapshot',
      type: 'text',
      required: true,
      admin: { readOnly: true, description: 'Job title at apply time — survives later job edits/deletes.' },
    },
    // Not `required` at the collection level: create-time enforcement lives in
    // the careers-apply endpoint (applicationFieldsSchema). Leaving these
    // optional lets the retention purge null them without tripping Payload's
    // required-field validation on update.
    { name: 'firstName', type: 'text' },
    { name: 'lastName', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'coverLetter', type: 'textarea' },
    {
      name: 'linkedinUrl',
      type: 'text',
      hooks: { beforeValidate: [normalizeOptionalUrlHook] },
      validate: validateOptionalUrl,
    },
    { name: 'resume', type: 'relationship', relationTo: 'resumes', required: true },
    { name: 'source', type: 'text', admin: { position: 'sidebar', description: 'Referrer URL.' } },
    { name: 'ip', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'userAgent', type: 'text', admin: { readOnly: true } },
    { name: 'consentGivenAt', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'consentSnapshot', type: 'textarea', admin: { readOnly: true } },
    { name: 'privacyPolicyVersion', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    {
      type: 'group',
      name: 'emailDelivery',
      label: 'HR email delivery',
      admin: { readOnly: true },
      fields: [
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Sent', value: 'synced' },
            { label: 'Failed', value: 'failed' },
            { label: 'Skipped (not configured)', value: 'skipped' },
          ],
        },
        { name: 'messageId', type: 'text' },
        { name: 'error', type: 'text' },
      ],
    },
    { name: 'honeypot', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    {
      name: 'turnstilePassed',
      type: 'checkbox',
      defaultValue: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'piiRedactedAt',
      type: 'date',
      access: { update: () => false },
      admin: { readOnly: true, position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
  timestamps: true,
};
