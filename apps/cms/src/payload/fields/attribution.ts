import type { Field } from 'payload';

import { LEAD_CHANNEL_OPTIONS, LEAD_DEVICE_OPTIONS } from '../lib/lead-handlers/attribution';

/**
 * Marketing attribution, shared by every collection that captures a
 * submission from the public site.
 *
 * These field groups started life inline on `leads`. Deal registrations,
 * partner applications and career applications each capture a person who
 * arrived through the same campaigns, so they carry the same shape rather
 * than three near-copies that drift.
 *
 * `utm` is last touch, read from the query string at submit time.
 * `attribution` is first touch plus the ad click IDs and the server-derived
 * channel.
 */

/** Last-touch UTMs from the query string at submit time. */
export const utmField = (): Field => ({
  type: 'group',
  name: 'utm',
  label: 'UTM (last touch)',
  admin: {
    description: 'UTMs from the query string at submit time (last touch).',
    position: 'sidebar',
  },
  fields: [
    { name: 'campaign', type: 'text' },
    { name: 'source', type: 'text' },
    { name: 'medium', type: 'text' },
    { name: 'term', type: 'text' },
    { name: 'content', type: 'text' },
  ],
});

/**
 * First-touch campaign, ad click IDs, device and the derived channel.
 *
 * `channel` is read-only in the admin because it is derived server-side from
 * the UTMs, click IDs and referrer. Accepting it from the client would let a
 * submitter label their own traffic.
 */
export const attributionField = (): Field => ({
  type: 'group',
  name: 'attribution',
  label: 'Attribution',
  admin: {
    description:
      'Server-derived channel, ad click IDs, device, and the first-touch campaign that originally sourced this visitor.',
    position: 'sidebar',
  },
  fields: [
    {
      name: 'channel',
      type: 'select',
      options: LEAD_CHANNEL_OPTIONS,
      admin: {
        description: 'Derived server-side from UTMs, click IDs, and referrer. Read-only.',
        readOnly: true,
      },
    },
    {
      name: 'device',
      type: 'select',
      options: LEAD_DEVICE_OPTIONS,
      admin: { readOnly: true },
    },
    { name: 'gclid', type: 'text', label: 'Google Click ID', admin: { readOnly: true } },
    { name: 'fbclid', type: 'text', label: 'Meta Click ID', admin: { readOnly: true } },
    { name: 'liFatId', type: 'text', label: 'LinkedIn Click ID', admin: { readOnly: true } },
    {
      type: 'group',
      name: 'firstTouch',
      label: 'First touch',
      admin: {
        description: 'Campaign + landing page from the visitor’s first session.',
      },
      fields: [
        { name: 'source', type: 'text' },
        { name: 'medium', type: 'text' },
        { name: 'campaign', type: 'text' },
        { name: 'term', type: 'text' },
        { name: 'content', type: 'text' },
        { name: 'landingPage', type: 'text' },
        { name: 'referrer', type: 'text' },
        {
          name: 'at',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
  ],
});

/** Both groups, for collections that take the whole picture. */
export const attributionFields = (): Field[] => [utmField(), attributionField()];
