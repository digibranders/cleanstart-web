#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Create the `new-year-networking` row in the `forms` collection, the form
 * behind events.cleanstart.com/new-year-networking-event.
 *
 * The field names are a contract with apps/events (`API_FIELD` in
 * src/lib/event-form.ts). Pick up and drop are required only when
 * `cab_required` is "yes", through the field-level `conditions` group.
 *
 * No `hubspotFormGuid` and no CRM handlers: the form has no email, which the
 * HubSpot relay needs. Leads are stored in the CMS database only.
 *
 * Goes through payload.create so the collection hooks run as an editor's save
 * would. The row is published: the lead endpoint refuses a draft form.
 * Idempotent: an existing row is left as it is, except that a draft is published.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/seed-event-form.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const SLUG = 'new-year-networking';

const onlyWhenCab = {
  mode: 'all' as const,
  rules: [{ fieldName: 'cab_required', operator: 'equals' as const, value: 'yes' }],
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });

  const existing = await payload.find({
    collection: 'forms',
    where: { slug: { equals: SLUG } },
    limit: 1,
    depth: 0,
  });
  const found = existing.docs[0];
  if (found) {
    if (found._status !== 'published') {
      await payload.update({
        collection: 'forms',
        id: found.id,
        data: { _status: 'published' },
      });
      console.log(`Published forms/${SLUG} (id ${found.id}).`);
    } else {
      console.log(`forms/${SLUG} already exists (id ${found.id}). Nothing to do.`);
    }
    process.exit(0);
  }

  const created = await payload.create({
    collection: 'forms',
    data: {
      _status: 'published',
      name: 'New Year Networking Event',
      slug: SLUG,
      description:
        'Registration for the New Year Networking Event (CleanStart, Upwind, Cosmos One). Posted from events.cleanstart.com. No email field, so no HubSpot relay.',
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
  process.exit(0);
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
