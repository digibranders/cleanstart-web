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
 * Retention: the `purgeConsentLog` cron (jobs/purge-consent-log.ts) deletes
 * rows older than 24 months — GDPR Art. 5(1)(e) storage limitation.
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
  // Append-only audit log: rows are written ONLY by the `/ingest` service
  // endpoint via `overrideAccess: true` (which bypasses these rules), so
  // disabling create/update here removes the misleading admin "Create"/edit
  // affordances without blocking ingestion. Hand-authoring or editing a
  // consent record would destroy its evidentiary value as proof of consent
  // (GDPR Art. 7(1)). `delete` stays admin-gated for one-off erasure
  // requests; the retention cron purges in bulk via `overrideAccess`.
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
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
        readOnly: true,
        description:
          'Random per-visitor id stored in the cs_consent cookie. Not linked to any account.',
      },
    },
    {
      name: 'decision',
      type: 'select',
      required: true,
      admin: { readOnly: true },
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
        readOnly: true,
        description:
          'Resolved category map at decision time, e.g. { "essential": true, "analytics": false }.',
      },
    },
    { name: 'consentVersion', type: 'number', required: true, admin: { readOnly: true } },
    {
      name: 'gpc',
      type: 'checkbox',
      defaultValue: false,
      admin: { readOnly: true, description: 'Global Privacy Control signal present at decision time.' },
    },
    {
      name: 'country',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Coarse ISO country from x-vercel-ip-country (may be unknown locally).',
      },
    },
    {
      name: 'ipHash',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'HMAC-SHA256 of client IP (CONSENT_LOG_HMAC_SECRET). No raw IP stored.',
      },
    },
    {
      name: 'userAgentHash',
      type: 'text',
      admin: { readOnly: true, description: 'HMAC-SHA256 of user-agent. No raw UA stored.' },
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
