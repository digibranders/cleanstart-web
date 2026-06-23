import type { CollectionConfig, Field } from 'payload';

import { isAdmin, isAdminOrEditor } from '../access';
import {
  dealRegistrationApplyEndpoint,
  dealRegistrationApplyOptionsEndpoint,
} from '../endpoints/deal-registration-apply';

const SYNC_STATUSES = [
  { label: 'Created', value: 'synced' },
  { label: 'Failed', value: 'failed' },
  { label: 'Skipped (not configured)', value: 'skipped' },
];

const hubspotSyncGroup: Field = {
  type: 'group',
  name: 'hubspotSync',
  label: 'HubSpot Deal sync',
  admin: { readOnly: true },
  fields: [
    { name: 'status', type: 'select', options: SYNC_STATUSES },
    { name: 'dealId', type: 'text' },
    { name: 'error', type: 'text' },
    { name: 'attempts', type: 'number', defaultValue: 0 },
    { name: 'lastAttemptAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
  ],
};

export const DealRegistrations: CollectionConfig = {
  slug: 'deal-registrations',
  labels: { singular: 'Deal Registration', plural: 'Deal Registrations' },
  admin: {
    group: 'Marketing',
    useAsTitle: 'partnerName',
    defaultColumns: ['partnerName', 'prospectEmail', 'hubspotSync', 'createdAt'],
    description:
      'Partner deal registrations (append-only). Submitted via the /deal-registration form; a HubSpot Deal is created per row.',
  },
  access: {
    read: isAdminOrEditor,
    create: isAdmin,
    update: () => false,
    delete: isAdmin,
  },
  endpoints: [dealRegistrationApplyEndpoint, dealRegistrationApplyOptionsEndpoint],
  fields: [
    { name: 'partnerName', type: 'text', required: true },
    { name: 'partnerRepFirstName', type: 'text', required: true },
    { name: 'partnerRepLastName', type: 'text', required: true },
    { name: 'partnerRepEmail', type: 'email', required: true },
    { name: 'partnerRepPhone', type: 'text' },
    { name: 'prospectFirstName', type: 'text', required: true },
    { name: 'prospectLastName', type: 'text', required: true },
    { name: 'prospectEmail', type: 'email', required: true },
    { name: 'prospectPhone', type: 'text' },
    { name: 'dealDetails', type: 'textarea' },
    { name: 'source', type: 'text', admin: { position: 'sidebar', description: 'Referrer URL.' } },
    { name: 'ip', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'userAgent', type: 'text', admin: { readOnly: true } },
    { name: 'consentGivenAt', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'consentSnapshot', type: 'textarea', admin: { readOnly: true } },
    { name: 'privacyPolicyVersion', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'consentCategories', type: 'array', admin: { readOnly: true }, fields: [{ name: 'category', type: 'text' }] },
    hubspotSyncGroup,
    { name: 'honeypot', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'turnstilePassed', type: 'checkbox', defaultValue: true, admin: { readOnly: true, position: 'sidebar' } },
    {
      name: 'piiRedactedAt',
      type: 'date',
      access: { update: () => false },
      admin: { readOnly: true, position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
  timestamps: true,
};
