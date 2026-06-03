import type { CollectionConfig } from 'payload';

import { isAdmin } from '../access';
import { handleConsentIngest } from '../endpoints/consent-ingest';

/**
 * Append-only audit log of cookie-consent decisions captured by the web
 * CMP (apps/web). One row per decision event (accept / reject / custom).
 *
 * Rows are written exclusively by the `/api/consentLog/ingest` service
 * endpoint (shared-secret auth, `overrideAccess: true`); the admin UI is
 * read-only. No raw IP or user-agent is stored — only salted HMAC hashes
 * (`CONSENT_LOG_HMAC_SECRET`) and a coarse country code, for data
 * minimisation while preserving proof-of-consent (GDPR Art. 7(1)).
 *
 * Retention: a purge cron (Phase J3) deletes rows older than the consent
 * proof window. Out of scope here.
 */
export const ConsentLog: CollectionConfig = {
  slug: 'consentLog',
  labels: { singular: 'Consent record', plural: 'Consent log' },
  admin: {
    group: 'System',
    useAsTitle: 'anonymousId',
    defaultColumns: ['decision', 'country', 'consentVersion', 'gpc', 'createdAt'],
    description:
      'Audit trail of website cookie-consent decisions. Server-managed — written by the web CMP, never edited by hand.',
    hidden: false,
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  timestamps: true,
  fields: [
    {
      name: 'anonymousId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description:
          'Random per-visitor id stored in the cs_consent cookie. Not linked to any account.',
      },
    },
    {
      name: 'decision',
      type: 'select',
      required: true,
      options: [
        { label: 'Accept all', value: 'accept_all' },
        { label: 'Reject all', value: 'reject_all' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      name: 'categories',
      type: 'json',
      required: true,
      admin: {
        description:
          'Resolved category map at decision time, e.g. { "essential": true, "analytics": false }.',
      },
    },
    { name: 'consentVersion', type: 'number', required: true },
    {
      name: 'gpc',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Global Privacy Control signal present at decision time.' },
    },
    {
      name: 'country',
      type: 'text',
      admin: {
        description: 'Coarse ISO country from x-vercel-ip-country (may be unknown locally).',
      },
    },
    {
      name: 'ipHash',
      type: 'text',
      admin: {
        description: 'HMAC-SHA256 of client IP (CONSENT_LOG_HMAC_SECRET). No raw IP stored.',
      },
    },
    {
      name: 'userAgentHash',
      type: 'text',
      admin: { description: 'HMAC-SHA256 of user-agent. No raw UA stored.' },
    },
  ],
  endpoints: [
    {
      path: '/ingest',
      method: 'post',
      handler: handleConsentIngest,
    },
  ],
};
