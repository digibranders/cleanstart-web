import type { CollectionConfig } from 'payload';

import { isAdminEditorOrEvents, publishedOrAuthenticated } from '../access';
import { eventPagesEndpoints } from '../endpoints/event-pages';
import { slugField } from '../fields/slug';
import { eventLeadSource } from '../lib/event-pages/site';

/**
 * Events hosted on events.cleanstart.com. The nav label is "Event
 * Registrations": the list is the events, and opening one shows its
 * registrations. Distinct from `events`, which feeds the www /events listing.
 *
 * Each event has its own page at events.cleanstart.com/<slug>, co-branded with
 * the partner logos. Visitors register through a normal CMS form (the default
 * `event-registration` form unless the event picks another), so a registration
 * is a lead. `leads.source` = `event:<slug>` is what ties a lead to its event.
 */
export const EventPages: CollectionConfig = {
  slug: 'eventPages',
  labels: { singular: 'Event', plural: 'Event Registrations' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', '_status', 'registrationCount', 'updatedAt'],
    group: 'Marketing',
    description:
      'Events on events.cleanstart.com. Open an event to edit its page and see who registered.',
  },
  access: {
    // Anonymous reads (the events site) only ever see published events.
    read: publishedOrAuthenticated,
    create: isAdminEditorOrEvents,
    update: isAdminEditorOrEvents,
    delete: isAdminEditorOrEvents,
  },
  endpoints: eventPagesEndpoints,
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ source: 'title' }),
    {
      name: 'registrationOpen',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Untick to show the page but stop taking registrations.',
      },
    },
    {
      name: 'registrationCount',
      type: 'number',
      virtual: true,
      admin: { readOnly: true, position: 'sidebar', description: 'Registrations received so far.' },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            const slug = typeof data?.slug === 'string' ? data.slug : null;
            if (!slug) return 0;
            const res = await req.payload.count({
              collection: 'leads',
              where: { source: { equals: eventLeadSource(slug) } },
              overrideAccess: true,
            });
            return res.totalDocs;
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'One or two sentences. Used for the page description in search and link previews.' },
    },
    { name: 'dateLabel', type: 'text', admin: { description: 'Shown on the event card, for example "15 January 2027".' } },
    { name: 'venue', type: 'text', admin: { description: 'Shown on the event card.' } },
    {
      name: 'partners',
      type: 'array',
      labels: { singular: 'Partner', plural: 'Partners' },
      admin: {
        description:
          'Co-hosts shown after the CleanStart logo, in this order. Upload a logo that reads on a dark background (white or light).',
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'url', type: 'text', required: true, admin: { description: "The partner's website. The logo links to it." } },
        { name: 'logo', type: 'upload', relationTo: 'media', admin: { description: 'SVG or PNG. Without one the name is shown as text.' } },
      ],
    },
    {
      name: 'registrationForm',
      type: 'relationship',
      relationTo: 'forms',
      admin: {
        description:
          'Leave empty to use the default event form (event-registration). Pick another form from Forms for different questions.',
      },
    },
    {
      name: 'registrations',
      type: 'ui',
      admin: {
        components: {
          Field: '@/payload/admin/components/events/EventRegistrationsPanel.tsx#EventRegistrationsPanel',
        },
      },
    },
  ],
  // Draft and Publish buttons, like the other content collections.
  versions: { drafts: true, maxPerDoc: 25 },
  timestamps: true,
};
