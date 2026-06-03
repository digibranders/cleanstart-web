import type { CollectionConfig, Field } from 'payload';

import { isAdmin, isAdminOrEditor } from '../access';
import { normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

const DELIVERY_STATUSES: { label: string; value: string }[] = [
  { label: 'Sent', value: 'synced' },
  { label: 'Failed', value: 'failed' },
  { label: 'Skipped (not configured)', value: 'skipped' },
];

const deliveryGroup = (name: string, label: string): Field =>
  ({
    type: 'group' as const,
    name,
    label,
    admin: { readOnly: true },
    fields: [
      { name: 'status', type: 'select' as const, options: DELIVERY_STATUSES },
      { name: 'messageId', type: 'text' as const },
      { name: 'error', type: 'text' as const },
    ],
  });

/**
 * Partner ("Become a Partner") submissions — append-only. Created exclusively
 * by the partner-apply endpoint (overrideAccess); the public never POSTs here
 * directly. Entirely separate from the leads/HubSpot pipeline. Two Brevo emails
 * (applicant confirmation + admin notification) are sent at submit time; their
 * results are recorded on the emailDelivery* groups. PII is erased on DSAR
 * request only — there is no time-based purge cron.
 */
export const PartnerApplications: CollectionConfig = {
  slug: 'partner-applications',
  labels: { singular: 'Partner Inquiry', plural: 'Partner Inquiries' },
  admin: {
    group: 'Marketing',
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'company', 'emailDeliveryApplicant', 'createdAt'],
    description:
      'Partner inquiries (append-only). Submitted via the Become-a-Partner form; emailed to the team via Brevo.',
    components: {
      beforeListTable: ['@/payload/admin/components/PartnersExportButton.tsx#PartnersExportButton'],
    },
  },
  access: {
    read: isAdminOrEditor,
    create: isAdmin,
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    { name: 'firstName', type: 'text', required: true },
    { name: 'lastName', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'company', type: 'text', required: true },
    {
      name: 'website',
      type: 'text',
      hooks: { beforeValidate: [normalizeOptionalUrlHook] },
      validate: validateOptionalUrl,
    },
    { name: 'partnerReason', type: 'textarea' },
    { name: 'source', type: 'text', admin: { position: 'sidebar', description: 'Referrer URL.' } },
    { name: 'ip', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'userAgent', type: 'text', admin: { readOnly: true } },
    { name: 'consentGivenAt', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'consentSnapshot', type: 'textarea', admin: { readOnly: true } },
    { name: 'privacyPolicyVersion', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    {
      name: 'consentCategories',
      type: 'array',
      admin: { readOnly: true },
      fields: [{ name: 'category', type: 'text' }],
    },
    deliveryGroup('emailDeliveryApplicant', 'Applicant email'),
    deliveryGroup('emailDeliveryAdmin', 'Admin email'),
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
