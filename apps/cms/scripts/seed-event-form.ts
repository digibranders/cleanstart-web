#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Create what events.cleanstart.com needs to start: the default event form
 * (`event-registration` in the `forms` collection) and the first event page,
 * "New Year Networking Event". Events use the default form unless they pick
 * another one in the CMS.
 *
 * Pick up and drop are required only when `cab_required` is "yes", through the
 * field-level `conditions` group (which the lead validator honours).
 *
 * No `hubspotFormGuid` and no CRM handlers: the form has no email, which the
 * HubSpot relay needs. Leads are stored in the CMS database only.
 *
 * Partner logos: set EVENT_LOGO_DIR to a folder holding upwind.svg and
 * cosmos-one.svg (apps/events/public/logos has them) and the script uploads them
 * to Media and attaches them to the event's partners. Without it the events
 * site shows each partner's name as text until an editor uploads a logo in the
 * CMS (Marketing > Event Registrations). Partners that already have a logo are
 * left alone, so a re-run is safe.
 *
 * Goes through payload.create so the collection hooks run as an editor's save
 * would. The row is published: the lead endpoint refuses a draft form.
 * Idempotent: an existing row is left as it is, except that a draft is published.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/seed-event-form.ts
 */
import path from 'node:path';

import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const SLUG = 'event-registration';
const EVENT_SLUG = 'new-year-networking-event';

const onlyWhenCab = {
  mode: 'all' as const,
  rules: [{ fieldName: 'cab_required', operator: 'equals' as const, value: 'yes' }],
};

const ensureForm = async (payload: Awaited<ReturnType<typeof getPayload>>): Promise<void> => {
  const existing = await payload.find({
    collection: 'forms',
    where: { slug: { equals: SLUG } },
    limit: 1,
    depth: 0,
  });
  const found = existing.docs[0];
  if (found) {
    if (found._status !== 'published') {
      await payload.update({ collection: 'forms', id: found.id, data: { _status: 'published' } });
      console.log(`Published forms/${SLUG} (id ${found.id}).`);
    } else {
      console.log(`forms/${SLUG} already exists (id ${found.id}).`);
    }
    return;
  }

  const created = await payload.create({
    collection: 'forms',
    data: {
      _status: 'published',
      name: 'Event Registration',
      slug: SLUG,
      description:
        'Default registration form for events on events.cleanstart.com. No email field, so no HubSpot relay.',
      submitLabel: 'Register',
      fields: [
        { name: 'full_name', type: 'text', label: 'Full Name', required: true },
        { name: 'designation', type: 'text', label: 'Designation', required: true },
        { name: 'company', type: 'text', label: 'Company Name', required: true },
        { name: 'phone', type: 'tel', label: 'Phone Number', required: true },
        {
          name: 'cab_required',
          type: 'select',
          label: 'Cab Required',
          required: true,
          options: [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ],
        },
        {
          name: 'pickup_location',
          type: 'text',
          label: 'Pick up location',
          required: true,
          conditions: onlyWhenCab,
        },
        {
          name: 'drop_location',
          type: 'text',
          label: 'Drop location',
          required: true,
          conditions: onlyWhenCab,
        },
      ],
    },
  });
  console.log(`Created forms/${SLUG} (id ${created.id}).`);
};

const ensureEvent = async (payload: Awaited<ReturnType<typeof getPayload>>): Promise<number> => {
  const existing = await payload.find({
    collection: 'eventPages',
    where: { slug: { equals: EVENT_SLUG } },
    limit: 1,
    depth: 0,
  });
  if (existing.docs[0]) {
    console.log(`eventPages/${EVENT_SLUG} already exists (id ${existing.docs[0].id}).`);
    return existing.docs[0].id;
  }
  const created = await payload.create({
    collection: 'eventPages',
    data: {
      title: 'New Year Networking Event',
      slug: EVENT_SLUG,
      _status: 'published',
      registrationOpen: true,
      description:
        'Register for the New Year Networking Event hosted by CleanStart, Upwind and Cosmos One.',
      partners: [
        { name: 'Upwind', url: 'https://www.upwind.io' },
        { name: 'Cosmos One', url: 'https://www.cosmos.one' },
      ],
    },
  });
  console.log(`Created eventPages/${EVENT_SLUG} (id ${created.id}).`);
  return created.id;
};

const LOGO_FILES: Readonly<Record<string, string>> = {
  Upwind: 'upwind.svg',
  'Cosmos One': 'cosmos-one.svg',
};

const attachLogos = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  eventId: number,
): Promise<void> => {
  const dir = process.env.EVENT_LOGO_DIR;
  if (!dir) {
    console.log('EVENT_LOGO_DIR not set: partner logos not attached.');
    return;
  }
  const event = await payload.findByID({ collection: 'eventPages', id: eventId, depth: 0 });
  let changed = false;
  const partners = [];
  for (const partner of event.partners ?? []) {
    const file = LOGO_FILES[partner.name];
    if (partner.logo || !file) {
      partners.push(partner);
      continue;
    }
    const media = await payload.create({
      collection: 'media',
      data: { alt: `${partner.name} logo`, folder: 'web/event' },
      filePath: path.join(dir, file),
    });
    partners.push({ ...partner, logo: media.id });
    changed = true;
    console.log(`Uploaded ${file} as media/${media.id}.`);
  }
  if (changed) await payload.update({ collection: 'eventPages', id: eventId, data: { partners } });
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  await ensureForm(payload);
  const eventId = await ensureEvent(payload);
  await attachLogos(payload, eventId);
  process.exit(0);
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
